//go:build windows

// KLM QR Studio — peluncur Windows.
// Menyajikan aplikasi web (tertanam di dalam exe) di 127.0.0.1 lalu membukanya
// sebagai jendela aplikasi Microsoft Edge/Chrome. Tidak butuh internet.
package main

import (
	"embed"
	"io"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync/atomic"
	"syscall"
	"time"
	"unsafe"
)

//go:embed www
var webFS embed.FS

const (
	appName  = "KLM QR Studio"
	appID    = "KLMQRStudio"
	fixPort  = "47821"
	exeName  = "KLM QR Studio.exe"
	version  = "1.1.0"
	pingBody = "klm-qr-studio"
)

var (
	user32      = syscall.NewLazyDLL("user32.dll")
	msgBox      = user32.NewProc("MessageBoxW")
	lastPing    atomic.Int64
	gotPing     atomic.Bool
	localAppDat = os.Getenv("LOCALAPPDATA")
	installDir  = filepath.Join(localAppDat, "Programs", appName)
	dataDir     = filepath.Join(localAppDat, appID)
)

const (
	mbYesNo    = 0x04
	mbIconInfo = 0x40
	mbIconWarn = 0x30
	idYes      = 6
)

func box(text, title string, flags uintptr) int {
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(title)
	r, _, _ := msgBox.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), flags)
	return int(r)
}

func hidden(name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
	return cmd
}

func psQuote(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

func shortcut(lnk, target string) {
	script := "$s=(New-Object -ComObject WScript.Shell).CreateShortcut(" + psQuote(lnk) + ");" +
		"$s.TargetPath=" + psQuote(target) + ";$s.WorkingDirectory=" + psQuote(filepath.Dir(target)) + ";" +
		"$s.IconLocation=" + psQuote(target+",0") + ";$s.Description='Pembuat QR code';$s.Save()"
	_ = hidden("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script).Run()
}

func desktopDir() string {
	out, err := hidden("powershell", "-NoProfile", "-NonInteractive", "-Command", "[Environment]::GetFolderPath('Desktop')").Output()
	if err == nil && strings.TrimSpace(string(out)) != "" {
		return strings.TrimSpace(string(out))
	}
	return filepath.Join(os.Getenv("USERPROFILE"), "Desktop")
}

func startMenuLnk() string {
	return filepath.Join(os.Getenv("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs", appName+".lnk")
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	if _, err = io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

const uninstKey = `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\` + appID

func install(self string) (string, bool) {
	if err := os.MkdirAll(installDir, 0o755); err != nil {
		return self, false
	}
	target := filepath.Join(installDir, exeName)
	if err := copyFile(self, target); err != nil {
		box("Gagal memasang: "+err.Error()+"\n\nAplikasi tetap dijalankan langsung.", appName, mbIconWarn)
		return self, false
	}
	shortcut(startMenuLnk(), target)
	shortcut(filepath.Join(desktopDir(), appName+".lnk"), target)
	reg := func(name, typ, val string) {
		_ = hidden("reg", "add", uninstKey, "/v", name, "/t", typ, "/d", val, "/f").Run()
	}
	reg("DisplayName", "REG_SZ", appName)
	reg("DisplayVersion", "REG_SZ", version)
	reg("Publisher", "REG_SZ", "KLM")
	reg("DisplayIcon", "REG_SZ", target)
	reg("InstallLocation", "REG_SZ", installDir)
	reg("UninstallString", "REG_SZ", `"`+target+`" --uninstall`)
	reg("NoModify", "REG_DWORD", "1")
	reg("NoRepair", "REG_DWORD", "1")
	return target, true
}

func uninstall() {
	if box("Hapus "+appName+" dari komputer ini?", appName, mbYesNo|mbIconWarn) != idYes {
		return
	}
	os.Remove(startMenuLnk())
	os.Remove(filepath.Join(desktopDir(), appName+".lnk"))
	_ = hidden("reg", "delete", uninstKey, "/f").Run()
	os.RemoveAll(dataDir)
	// folder program dihapus setelah proses ini selesai
	_ = hidden("cmd", "/C", "ping -n 3 127.0.0.1 >nul & rmdir /s /q \""+installDir+"\"").Start()
	box(appName+" sudah dihapus.", appName, mbIconInfo)
}

func maybeInstall() {
	self, err := os.Executable()
	if err != nil {
		return
	}
	self, _ = filepath.Abs(self)
	if strings.EqualFold(filepath.Dir(self), installDir) {
		return
	}
	for _, a := range os.Args[1:] {
		if a == "--portable" {
			return
		}
	}
	os.MkdirAll(dataDir, 0o755)
	skip := filepath.Join(dataDir, "portable.flag")
	installed := filepath.Join(installDir, exeName)
	if _, err := os.Stat(skip); err == nil {
		return
	}
	msg := "Pasang " + appName + " ke komputer ini?\n\n• Shortcut di Desktop dan Start Menu\n• Bisa dihapus lewat Settings › Apps\n\nPilih \"No\" untuk menjalankan langsung tanpa memasang."
	if _, err := os.Stat(installed); err == nil {
		msg = "Perbarui " + appName + " yang sudah terpasang dengan versi ini?"
	}
	if box(msg, appName, mbYesNo|mbIconInfo) != idYes {
		os.WriteFile(skip, []byte("1"), 0o644)
		return
	}
	if target, ok := install(self); ok {
		// jalankan salinan yang terpasang, lalu keluar
		_ = exec.Command(target).Start()
		os.Exit(0)
	}
}

func findBrowser() string {
	pf, pf86 := os.Getenv("ProgramFiles"), os.Getenv("ProgramFiles(x86)")
	cands := []string{
		filepath.Join(pf86, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(localAppDat, `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(pf, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf86, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(localAppDat, `Google\Chrome\Application\chrome.exe`),
		filepath.Join(pf, `BraveSoftware\Brave-Browser\Application\brave.exe`),
	}
	for _, c := range cands {
		if st, err := os.Stat(c); err == nil && !st.IsDir() {
			return c
		}
	}
	return ""
}

func openWindow(url string) (waitable *exec.Cmd) {
	if b := findBrowser(); b != "" {
		prof := filepath.Join(dataDir, "Browser")
		os.MkdirAll(prof, 0o755)
		cmd := exec.Command(b, "--app="+url, "--user-data-dir="+prof, "--window-size=1300,900",
			"--no-first-run", "--no-default-browser-check", "--disable-features=Translate,msEdgeSidebarV2",
			"--disable-component-update", "--disable-background-mode")
		if cmd.Start() == nil {
			return cmd
		}
	}
	_ = hidden("rundll32", "url.dll,FileProtocolHandler", url).Start()
	return nil
}

func alreadyRunning() bool {
	c := http.Client{Timeout: 800 * time.Millisecond}
	r, err := c.Get("http://127.0.0.1:" + fixPort + "/__ping")
	if err != nil {
		return false
	}
	defer r.Body.Close()
	b, _ := io.ReadAll(r.Body)
	return string(b) == pingBody
}

func main() {
	for _, a := range os.Args[1:] {
		if a == "--uninstall" {
			uninstall()
			return
		}
	}
	maybeInstall()

	ln, err := net.Listen("tcp", "127.0.0.1:"+fixPort)
	if err != nil {
		if alreadyRunning() {
			openWindow("http://127.0.0.1:" + fixPort + "/")
			return
		}
		ln, err = net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			box("Tidak bisa memulai server lokal:\n"+err.Error(), appName, mbIconWarn)
			return
		}
	}
	url := "http://" + ln.Addr().String() + "/"

	mime.AddExtensionType(".webmanifest", "application/manifest+json")
	mime.AddExtensionType(".js", "text/javascript; charset=utf-8")
	sub, _ := fs.Sub(webFS, "www")
	files := http.FileServer(http.FS(sub))
	mux := http.NewServeMux()
	mux.HandleFunc("/__ping", func(w http.ResponseWriter, r *http.Request) {
		lastPing.Store(time.Now().Unix())
		gotPing.Store(true)
		w.Header().Set("Cache-Control", "no-store")
		io.WriteString(w, pingBody)
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")
		files.ServeHTTP(w, r)
	})
	go http.Serve(ln, mux)

	start := time.Now()
	cmd := openWindow(url)
	var done chan struct{}
	if cmd != nil {
		done = make(chan struct{})
		go func() { cmd.Wait(); close(done) }()
	}
	tick := time.NewTicker(5 * time.Second)
	defer tick.Stop()
	for {
		select {
		case <-done:
			// jendela ditutup (bila browser tidak langsung menyerahkan ke proses lain)
			if time.Since(start) > 8*time.Second {
				return
			}
			done = nil
		case <-tick.C:
			now := time.Now().Unix()
			if !gotPing.Load() {
				if time.Since(start) > 2*time.Minute {
					return
				}
				continue
			}
			// halaman mengirim ping tiap 15 dtk; jendela yang diminimalkan bisa melambat ±1 menit
			if now-lastPing.Load() > 150 {
				return
			}
		}
	}
}

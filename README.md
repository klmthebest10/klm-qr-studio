# KLM QR Studio

Pembuat QR code dengan kustomisasi lengkap. Semua proses di perangkat — tanpa server, bisa offline, bisa dipasang (PWA) dan tersedia versi Windows (.exe).

**Buka aplikasi:** https://klmthebest10.github.io/klm-qr-studio/
**Unduh versi Windows:** [KLM-QR-Studio-Windows.zip](https://github.com/klmthebest10/klm-qr-studio/raw/main/unduh/KLM-QR-Studio-Windows.zip) (atau halaman [Releases](https://github.com/klmthebest10/klm-qr-studio/releases/latest))

## Fitur
- **12 jenis isi:** Tautan, Teks, WiFi, Kontak (vCard), Email, SMS, Telepon, WhatsApp, Lokasi, Acara kalender, Sosmed, Info transfer
- **Gaya:** 13 bentuk titik, 8 bingkai mata, 8 bola mata, ukuran titik, 10 template
- **Warna:** polos / gradasi / radial untuk titik & latar, warna mata terpisah, latar transparan, sudut membulat
- **Logo:** unggah, seret, tempel, atau ikon cepat; ukuran, jarak, sudut, latar logo
- **Bingkai berteks:** bawah, atas, gelembung, kapsul, garis
- **QR berisi foto:** jenis isi *Foto* menyimpan foto kecil langsung di dalam QR (tanpa server). Saat dipindai, HP membuka `lihat.html` yang menampilkan fotonya. Atau pakai tautan foto online untuk foto ukuran penuh
- **QR foto:** pasang foto sebagai latar QR (gaya halftone) atau isi titik-titik QR dengan foto; potong, perbesar, geser, kecerahan, kontras, hitam putih, dan kerapatan QR. Otomatis ECC H dan penjaga keterbacaan
- **Lapisan teks:** tambah teks sebanyak apa pun di atas / bawah / kiri / kanan QR atau bebas di mana saja (bisa diseret di pratinjau, diputar). Atur huruf, ketebalan, miring, ukuran, warna, jarak huruf & baris, banyak baris, dan label berlatar
- **Lanjutan:** ECC L/M/Q/H, versi minimum, pola mask, zona tenang
- **Ekspor:** PNG / SVG / JPG / WEBP sampai 4096 px, salin, bagikan, cetak
- **Massal:** banyak QR sekaligus jadi satu ZIP, dengan `{nama}`, `{no}`, `{isi}` di teks
- Riwayat, simpan gaya, impor/ekspor pengaturan, peringatan kontras, tema terang/gelap, Ctrl+S untuk unduh

## Versi Windows
`KLM QR Studio.exe` adalah satu file tanpa instalasi tambahan. Saat pertama dibuka, aplikasi menawarkan pemasangan (shortcut Desktop & Start Menu, bisa dihapus lewat Settings › Apps). Aplikasi tampil sebagai jendela sendiri lewat Microsoft Edge/Chrome yang sudah ada di Windows.

Karena exe belum ditandatangani, Windows SmartScreen bisa memberi peringatan: klik **More info → Run anyway**.

Setiap kali tag `v*` (misalnya `v1.2.0`) di-push, GitHub Actions otomatis membangun exe dan menerbitkannya di Releases.

Bangun sendiri: masuk ke folder `windows/`, jalankan `build.bat` (Windows) atau `./build.sh` (Linux/macOS). Butuh Go 1.21+.

## Struktur
- `index.html`, `style.css`, `app.js` — aplikasi
- `qrcodegen.js` — encoder QR dari [nayuki/QR-Code-generator](https://github.com/nayuki/QR-Code-generator) (MIT)
- `lihat.html` — halaman penampil untuk QR berisi foto
- `sw.js`, `manifest.webmanifest`, `icons/` — PWA
- `windows/` — peluncur Windows (Go)

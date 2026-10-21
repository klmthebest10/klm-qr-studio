@echo off
rem Bangun "KLM QR Studio.exe" (butuh Go 1.21+). Jalankan dari folder windows\.
if exist www rmdir /s /q www
mkdir www
for %%f in (index.html lihat.html style.css app.js qrcodegen.js sw.js manifest.webmanifest) do copy /y "..\%%f" www\ >nul
xcopy /e /i /y ..\icons www\icons >nul
set GOOS=windows& set GOARCH=amd64& set CGO_ENABLED=0
go build -trimpath -ldflags "-H windowsgui -s -w" -o "KLM QR Studio.exe" .
rmdir /s /q www
echo Selesai: windows\KLM QR Studio.exe

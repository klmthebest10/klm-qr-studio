#!/bin/sh
# Bangun "KLM QR Studio.exe" (butuh Go 1.21+). Jalankan dari folder windows/.
set -e
rm -rf www && mkdir www
cp -r ../index.html ../lihat.html ../style.css ../app.js ../qrcodegen.js ../sw.js ../manifest.webmanifest ../icons www/
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o "KLM QR Studio.exe" .
rm -rf www
echo "Selesai: windows/KLM QR Studio.exe"

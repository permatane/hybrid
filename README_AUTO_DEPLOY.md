# RIVIS · GitHub → Netlify Auto Deploy

Repository: `permatane/hybrid` · Branch: `main`.
Existing Netlify site: **https://vectorichqc2026.netlify.app**.

## Konfigurasi satu kali di Netlify

1. Login ke Netlify dan buka **site yang sudah ada**: `vectorichqc2026`. **Jangan buat site baru**.
2. Buka **Project configuration → Developer settings → Continuous deployment → Repository** (nama menu bisa sedikit berubah).
3. Pilih **Link repository**, authorize GitHub jika diminta, lalu pilih repository `permatane/hybrid` dan production branch `main`.
4. Konfigurasi build: Base directory **kosong** (root), Build command `npm test`, Publish directory `public`, Functions directory `netlify/functions`. Nilai ini juga tersimpan dalam `netlify.toml`.
5. Pastikan Environment Variables lama tetap ada: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RIVIS_SESSION_SECRET`, `RIVIS_SPREADSHEET_ID`, dan `RIVIS_DRIVE_FOLDER_ID`. **Jangan memasukkan nilai rahasia ke GitHub**.
6. Setelah repo berhasil terhubung, Netlify akan build dan deploy otomatis setiap perubahan pada branch `main`. Periksa statusnya di **Deploys → Production deploys**.

## Verifikasi

- Test Node: `npm test` (semua 32 kasus harus lulus).
- Website: https://vectorichqc2026.netlify.app
- Gateway: https://vectorichqc2026.netlify.app/rivis-cloud/
- RIVIS Canvas tetap memuat AI Runtime dari `hybrid/` dan Cloud Gateway dari domain Netlify yang sama.
- Coba Connect Google → Save Idea tanpa gambar → Save Idea dengan SVG reference → Save Card JPG/PNG → Refresh Cloud Gallery.

## Pembaruan otomatis berikutnya

- Untuk Gateway/Vectorich QC, cukup commit perubahan file di `netlify/`, `public/`, atau `tests/` pada `permatane/hybrid` branch `main`.
- Netlify menjalankan `npm test` terlebih dahulu; jika gagal, deployment dihentikan.
- Untuk perubahan Runtime RIVIS (`hybrid/rivis.support.js`, `hybrid/rivis.ai.js`, `hybrid/version.json`), Canvas RIVIS menggunakan Cek Update. Commit di repo yang sama juga dapat memicu rebuild Netlify meskipun Gateway tidak berubah.

**Penting:** Menambahkan repository ke project Netlify yang sudah ada adalah otorisasi satu kali di dashboard Netlify. Tindakan itu belum dapat dilakukan otomatis dari ChatGPT tanpa konektor Netlify.

# RIVIS Cloud Gateway + Vectorich QC v4.02

Paket deploy manual ke situs Netlify yang sudah ada: **https://vectorichqc2026.netlify.app**.

## 1. Perubahan pada rilis 1.3.4

- **SVG Reference Support:** file `.svg` (`image/svg+xml`) dapat disimpan sebagai gambar referensi ke Google Drive dan dicatat di tab ASSETS. SVG tetap dibatasi untuk `assetType=reference`; SVG tidak diterima sebagai gambar hasil generate. Format pada indeks ASSETS dicatat sebagai `svg`.
- **SVG Gallery Preview:** jika Google Drive tidak menyediakan thumbnail SVG, Gateway menampilkan file SVG asli sebagai preview terbatas maksimal 1 MB.
- **SVG Reference AI Analysis:** GitHub AI Runtime 3.4.95 mengubah SVG referensi menjadi PNG sementara (maksimum sisi 2048 px) untuk analisis Gemini. File asli tetap disimpan di Drive dalam format SVG.
- **Cloud Gallery Pagination:** GitHub Runtime 3.4.95 membatasi tampilan menjadi 20 card per halaman, dengan tombol nomor halaman, Previous/Next, dan indikator rentang item.
- Tidak ada perubahan pada Canvas HTML, struktur enam tab Google Sheets, Environment Variables, maupun Vectorich QC.

### Perbaikan sebelumnya (1.3.3)

**Perbaikan khusus untuk laporan `0 card tersimpan` / `Gateway tidak merespons dalam 180 detik` saat menyimpan gambar.**

- Ukuran upload diubah dari 3 MB menjadi 1 MiB per chunk. Setiap request tetap sesuai kelipatan Google Drive 256 KiB.
- Tiap request Gateway dan proxy Google Drive memiliki timeout yang terbatas, bukan satu operasi `fetch()` yang menggantung tanpa batas.
- Jika chunk gagal, Gateway menanyakan status resmi sesi resumable Google Drive (`Content-Range: bytes */total`), melanjutkan dari byte terakhir yang sudah diterima, dan membatasi retry.
- Popup mengirim `RIVIS_CLOUD_PROGRESS` setiap tahap ke RIVIS. GitHub Runtime 3.4.92 memakai progres ini untuk memperbarui inactivity timeout: upload tidak otomatis dianggap gagal setelah tepat 180 detik apabila masih maju.
- `cloud-upload-complete` melakukan maksimal dua percobaan pencatatan ASSETS. Ketika Drive sukses tetapi ASSETS gagal, error menampilkan Drive file ID yang sudah tersimpan.
- Asset ID yang stabil (`ideaId + type + scene + hash gambar`) dibuat di Runtime 3.4.92. Gateway 1.3.4 dapat menemukan file identik dari percobaan sebelumnya yang menggunakan ID stabil, lalu mengindeksnya tanpa upload ulang.
- Tidak ada perubahan pada data existing Google Sheets, tab, izin, struktur Canvas HTML, maupun aplikasi Vectorich QC.

### Perbaikan sebelumnya (1.3.2)

- **Perbaikan kritis Google Sheets Append:** seluruh permintaan POST kini menggunakan endpoint REST `values/{range}:append`. Gateway 1.3.1 mengirim POST ke `values/{range}` tanpa akhiran `:append`, sehingga Google Sheets menolak penulisan dengan HTTP 400 meskipun file sudah berhasil diunggah ke Drive. Perbaikan mencakup `IDEAS`, `PROMPTS`, `ASSETS`, `GROUPS`, `GROUP ITEMS`, dan `GENERATION LOG`.
- **Diagnostik ASSETS:** respons error Google Sheets sekarang menyertakan pesan, status, dan detail API yang tersedia.

- **Cloud Gallery:** RIVIS menampilkan card cloud sebagai galeri visual, lengkap dengan thumbnail, tipe aset, skor, dan tombol Load to Library.
- **Koneksi lebih sederhana:** cukup Connect Google. Gateway otomatis memverifikasi folder Drive, spreadsheet, dan enam tab indeks yang sudah ditetapkan di Netlify. Tidak perlu lagi memilih folder, memilih spreadsheet, Test Connection, atau mengirim pilihan secara manual.
- **Perbaikan upload CORS:** browser tidak lagi mengirim `fetch()` langsung ke URL upload Google Drive. Popup mengirim gambar ke endpoint Netlify same-origin, lalu Gateway meneruskan setiap chunk ke Google Drive dari backend.
- **Chunked Resumable Upload:** upload menggunakan potongan 1 MiB (kelipatan 256 KiB) agar request tetap di bawah batas payload function Netlify. Batas aplikasi tetap 100 MB per asset.
- **Perbaikan indeks Sheets:** seluruh tab sekarang membaca, mencari, memperbarui, dan menambahkan data mulai kolom A sesuai header spreadsheet aktual. Sebelumnya Gateway menggunakan kolom B sehingga data bergeser satu kolom.
- **Schema Preflight:** Connect Google memeriksa header pada keenam tab, bukan hanya keberadaan nama tab. Ketidaksesuaian kolom akan ditampilkan sebelum Cloud Connected diaktifkan.
- **Error diagnostik:** pesan kegagalan Sheets menyertakan status HTTP dan pesan Google API agar penyebab penolakan tidak tersembunyi.
- **Chunked Restore:** pemuatan gambar dari Drive menggunakan potongan 1 MB sehingga tidak perlu mengirim satu file besar melalui Netlify Function.
- **Gallery Thumbnail:** preview kecil diambil dari thumbnail Google Drive agar daftar card lebih ringan.
- **Index ASSETS:** setiap upload diverifikasi terhadap folder RIVIS dan dicatat di tab ASSETS.
- `public/index.html` tetap merupakan salinan byte-per-byte dari Vectorich QC v4.02. Tidak ada perubahan pada aplikasi QC.

## 2. Environment Variables Netlify

Buka **Site configuration → Environment variables** pada site `vectorichqc2026` dan pastikan variabel berikut tersedia:

| Key | Nilai / sumber | Keterangan |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth Client ID Anda | OAuth Web Application |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret Anda | Rahasia, hanya di Netlify |
| `RIVIS_SESSION_SECRET` | 32 byte random dalam format Base64 | Enkripsi sesi AES-256-GCM |
| `RIVIS_SPREADSHEET_ID` | `set via Netlify environment variable RIVIS_SPREADSHEET_ID` | RIVIS Cloud Index |
| `RIVIS_DRIVE_FOLDER_ID` | `set via Netlify environment variable RIVIS_DRIVE_FOLDER_ID` | Folder utama Cloud Gallery |

`GOOGLE_PICKER_API_KEY` dan `GOOGLE_PROJECT_NUMBER` tidak lagi dibutuhkan oleh Gateway 1.3.4 karena pemilihan folder dan spreadsheet dilakukan otomatis melalui ID yang sudah dikonfigurasi di Netlify.

Untuk membuat `RIVIS_SESSION_SECRET`, jalankan di komputer yang memiliki Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

**Jangan kirim Client Secret atau Session Secret melalui chat.** Jangan menghapus atau mengganti nilai rahasia yang sudah benar saat melakukan pembaruan.

## 3. Google Cloud OAuth

Pastikan OAuth Client bertipe **Web application** menggunakan:

- Authorized JavaScript Origins: `https://vectorichqc2026.netlify.app`
- Authorized Redirect URIs: `https://vectorichqc2026.netlify.app/rivis-cloud/callback`
- Google Drive API dan Google Sheets API aktif.
- OAuth consent screen dan Test Users sudah memuat akun Google yang digunakan apabila aplikasi masih berstatus Testing.

Google Picker API dan API Key Picker tidak lagi diperlukan untuk alur Gateway 1.3.4.

## 4. Deploy ulang ke Netlify

1. Cadangkan deploy Netlify yang sedang aktif.
2. Ekstrak ZIP ini ke komputer.
3. Buka terminal pada folder yang berisi `netlify.toml`.
4. Jalankan:

```bash
npm install -g netlify-cli
netlify login
netlify link
netlify deploy --prod --dir public --functions netlify/functions
```

Pada `netlify link`, pilih site **vectorichqc2026** yang sudah ada. Jangan membuat site baru. Environment Variables yang lama tetap digunakan.

## 5. Cara menggunakan

1. **Perbarui GitHub Runtime menjadi 3.4.92** melalui Cek Update di RIVIS. Canvas HTML tidak berubah.
2. Deploy paket Cloud Gateway **1.3.4** ke site Netlify yang sama.
3. Buka RIVIS → **CLOUD GALLERY** → **Reconnect Google**.
4. Login Google pada popup. Gateway otomatis memeriksa folder Drive, spreadsheet, enam tab, dan header kolom.
5. Setelah badge menjadi **CLOUD CONNECTED**, popup Gateway boleh tetap terbuka selama proses Save/Load.
6. Di Library lokal, gunakan **Save to Cloud** pada card, atau **Save All to Cloud** untuk seluruh card.
7. Saat Save to Cloud, amati progres upload pada popup Gateway dan status di Cloud Gallery. Setelah selesai, buka CLOUD GALLERY dan gunakan **Refresh Gallery**. Pilih **Load to Library** pada card yang ingin dipulihkan.

### Sinkronisasi gambar

- Upload memakai Google Drive Resumable Upload melalui proxy backend Netlify. Browser tidak melakukan request lintas-origin langsung ke Google Drive.
- Setiap chunk berukuran maksimum 1 MiB; Gateway mengirimkannya ke Google Drive dengan `Content-Range`.
- Batas aman aplikasi saat ini 100 MB per file.
- Download gambar menggunakan chunk 1 MB, kemudian RIVIS menyusun kembali file sebelum menyimpannya ke Library lokal.
- Fingerprint SHA-256 mencegah upload ulang gambar yang tidak berubah.
- Thumbnail Gallery memakai metadata thumbnail Google Drive; bila Google tidak menyediakan thumbnail, card tetap dapat dimuat dengan tombol Load to Library.

## 6. Struktur data

Google Sheets menggunakan enam tab yang sudah ada:

- `IDEAS`
- `PROMPTS`
- `ASSETS`
- `GROUPS`
- `GROUP ITEMS`
- `GENERATION LOG`

Header berada pada baris 1 mulai kolom A. Data card dan prompt ditambahkan mulai baris 2, dengan ID pada kolom A. Gateway 1.3.4 memeriksa header dan menggunakan range kolom A pada keenam tab. File gambar disimpan di folder Google Drive yang dikonfigurasi pada `RIVIS_DRIVE_FOLDER_ID`.

## 7. Pemeriksaan dan troubleshooting

- `CLOUD NOT CONNECTED`: klik Connect Google dan selesaikan login.
- `GOOGLE SIGNED IN`: akun berhasil login tetapi pemeriksaan folder atau spreadsheet belum berhasil.
- `CLOUD CONNECTED`: Drive, Sheets, enam tab, dan struktur header sudah terverifikasi.
- `Header mismatch`: periksa baris pertama tab yang disebutkan. Header harus dimulai dari kolom A dan sesuai dengan nama kolom standar RIVIS.
- `RIVIS_DRIVE_FOLDER_ID` / `RIVIS_SPREADSHEET_ID is not configured`: periksa Environment Variables Netlify dan deploy ulang.
- Upload gagal sebelum file masuk Drive: periksa sesi Google, izin tulis folder, koneksi, dan ukuran file (maksimum aplikasi 100 MB). Gateway mengirim upload melalui proxy Netlify per chunk 1 MiB, bukan langsung dari browser ke Google.
- `upload chunk timeout`: Gateway mencoba memeriksa byte yang diterima Drive dan melanjutkan secara otomatis. Jika tetap gagal, pesan mencantumkan tahap/persentase.
- `Upload 100% tetapi indeks ASSETS gagal`: file sudah berada di Drive; jangan hapus file tersebut. Salin Drive file ID dari pesan agar dapat dicocokkan. Retry dengan asset ID stabil mencegah duplikasi untuk file baru.
- Jika pesan **180 detik** lama masih muncul, berarti GitHub Runtime yang terpakai belum 3.4.92; lakukan Cek Update dan refresh tab RIVIS, serta tutup popup Gateway lama.
- Upload berhasil tetapi ASSETS tidak terbarui: periksa izin edit spreadsheet dan tab `ASSETS`.
- Thumbnail tidak tampil: thumbnail Google Drive mungkin belum tersedia; gunakan Load to Library untuk mengambil file asli.

## 8. Keamanan

- OAuth Authorization Code ditukar di backend Netlify.
- Access token dan refresh token disimpan pada cookie `HttpOnly`, `SameSite=Lax`, terenkripsi AES-256-GCM.
- Canvas tidak menerima OAuth token.
- Resumable upload URL hanya digunakan sementara di popup Gateway dan tidak disimpan ke Library.
- Upload completion memverifikasi bahwa file benar-benar berada di folder RIVIS yang dikonfigurasi.

## 9. Versi

| Komponen | Versi | Status |
|---|---:|---|
| Vectorich QC | 4.02 | Tidak berubah |
| Canvas HTML RIVIS | Revisi 4 | Tidak berubah |
| RIVIS GitHub Runtime | **3.4.95** | Berubah: SVG reference AI analysis dan Cloud Gallery pagination |
| RIVIS Cloud Gateway | **1.3.4** | Berubah: chunk 1 MiB, retry/resume, timeout per tahap, dan recovery indeks |

Pengujian otomatis lokal dijalankan menggunakan `npm test` (32/32 PASS, termasuk simulasi Browser Gateway yang upload-nya terputus lalu berhasil resume). Paket ZIP ini memperbarui Gateway; GitHub Runtime 3.4.95 sudah diperbarui di repo `permatane/hybrid`. Canvas HTML RIVIS dan `public/index.html` Vectorich QC tidak diubah. Pengujian tersebut memverifikasi struktur request dan alur fungsi, bukan transaksi live ke akun Google. Transaksi nyata perlu dikonfirmasi setelah deploy Netlify.

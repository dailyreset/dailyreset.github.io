DAILY RESET — ANDROID PWA
=========================

Isi:
- Habit tracker harian dengan streak per habit
- To-do list, prioritas, deadline, dan filter
- Target bulanan dengan progres manual
- Statistik habit 7 hari terakhir
- Review mingguan/bulanan
- Data tersimpan di browser perangkat (localStorage)
- Ekspor backup data JSON
- Dukungan offline setelah pertama kali dibuka, melalui service worker

PENTING:
Ini adalah web app installable (PWA), bukan file APK native.
Agar bisa dipasang seperti aplikasi di Android, file perlu di-host di alamat HTTPS
(misalnya GitHub Pages). Setelah dibuka di Chrome Android, pilih "Pasang app"
atau menu ⋮ > "Tambahkan ke layar utama".

CARA PAKAI PALING MUDAH (GitHub Pages):
1. Buat akun / login di GitHub.
2. Buat repository baru, misalnya "daily-reset".
3. Upload semua file di folder ini ke root repository.
4. Di Settings > Pages, aktifkan deploy dari branch main dan folder /(root).
5. Tunggu sampai GitHub memberikan URL HTTPS.
6. Buka URL itu di Chrome pada Android.
7. Tekan "Pasang app" jika muncul, atau menu ⋮ > "Tambahkan ke layar utama".

PENYIMPANAN:
Data disimpan lokal di browser HP. Menghapus data browser dapat menghapus data app.
Gunakan tombol "Ekspor backup data" di tab Statistik secara berkala.
Data tidak otomatis sinkron antarperangkat.

CATATAN FITUR:
- Streak dihitung berdasarkan hari kalender lokal dan log setiap habit.
- Statistik menampilkan checklist habit 7 hari terakhir dan total tugas yang selesai.
- Review disimpan per bulan.
- Notifikasi pengingat belum disertakan.

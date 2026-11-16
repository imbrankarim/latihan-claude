# Layanan Kepegawaian — Kemenham Wilayah Kerja Sulawesi Tenggara

Vue 3 (Vite) + Express + SQLite (`node:sqlite` bawaan Node, perlu Node >= 22.13; tanpa kompilasi native).

## Menjalankan
```bash
npm run install:all
npm run seed        # memuat 33 pegawai dari backend/data/pegawai.json (opsional; otomatis jika DB kosong)
npm run dev:api     # http://localhost:3000
npm run dev:web     # http://localhost:5173 (proxy /api ke :3000)
```
Produksi: `npm run build && npm start` (Express menyajikan `frontend/dist`).

## Aturan perhitungan (backend/src/app.js)
- **Kenaikan pangkat**: hanya `reguler = TRUE`; tanggal = `tmt_pangkat + 4 tahun`.
- **KGB**: semua pegawai; tanggal = `tmt_gaji_terakhir + 2 tahun`.
- Status: *Jatuh tempo* (≤ hari ini), *< 3 bulan*, *< 1 tahun*, *Belum waktunya*. Dihitung saat request (WITA), tidak disimpan di DB.

## Database
SQLite via `node:sqlite` (file `backend/data/kepegawaian.db`). Skema di `backend/src/db.js`. Untuk produksi multi-user, migrasi ke PostgreSQL cukup mengganti `db.js` dan query di `app.js`.

## Login admin
- Hanya admin yang bisa menambah, mengedit, dan menghapus pegawai (halaman Data Pegawai, menu **Login Admin**). Halaman lain tetap publik.
- Akun pertama dibuat otomatis saat server pertama jalan. Atur lewat environment variable:
  ```powershell
  $env:ADMIN_USERNAME="admin"; $env:ADMIN_PASSWORD="password-kuat-anda"; npm run dev:api
  ```
  Jika `ADMIN_PASSWORD` tidak diisi, password acak dicetak **sekali** di terminal. Jika terlewat, hapus `backend/data/kepegawaian.db` lalu jalankan ulang (data di-seed ulang dari Excel — perubahan data akan hilang).
- Password disimpan sebagai hash scrypt; sesi memakai JWT (8 jam). Secret dibuat otomatis, atau set `JWT_SECRET`.
- Ganti password lewat menu nama admin (kanan atas) → **Ganti Password** (minimal 8 karakter). Sesi di perangkat lain otomatis keluar.
- Login dibatasi 10 percobaan per 15 menit per IP. **Gunakan HTTPS saat dipublikasikan.**

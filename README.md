# Layanan Kepegawaian — Kemenham Wilayah Kerja Sulawesi Tenggara

Vue 3 (Vite) + Express + SQLite.

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
SQLite (file `backend/data/kepegawaian.db`). Skema di `backend/src/db.js`. Untuk produksi multi-user, migrasi ke PostgreSQL cukup mengganti `db.js` dan query di `app.js`.

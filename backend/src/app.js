import express from 'express';
import cors from 'cors';
import { addYears, todayISO, statusJatuhTempo, monthsBetween } from './dates.js';

const URUT = { terlambat: 0, segera: 1, tahun_ini: 2, belum: 3 };

function decorate(row, tanggalSelanjutnya, today) {
  const status = statusJatuhTempo(tanggalSelanjutnya, today);
  return {
    ...row,
    reguler: !!row.reguler,
    tanggal_selanjutnya: tanggalSelanjutnya,
    status,
    sisa_bulan: monthsBetween(today, tanggalSelanjutnya),
  };
}

function ringkasan(items) {
  const r = { total: items.length, terlambat: 0, segera: 0, tahun_ini: 0, belum: 0 };
  for (const i of items) r[i.status]++;
  return r;
}

export function createApp(db, { now = () => new Date() } = {}) {
  const app = express();
  app.use(cors());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/pegawai', (req, res) => {
    const { q, unit, status } = req.query;
    const where = [], args = {};
    if (q) { where.push('(nama LIKE @q OR nip LIKE @q OR jabatan LIKE @q)'); args.q = `%${q}%`; }
    if (unit) { where.push('unit = @unit'); args.unit = unit; }
    if (status) { where.push('status_kepegawaian = @status'); args.status = status; }
    const sql = `SELECT * FROM pegawai ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`;
    const rows = db.prepare(sql).all(args).map(r => ({ ...r, reguler: !!r.reguler }));
    res.json({ data: rows, total: rows.length });
  });

  app.get('/api/unit', (_req, res) => {
    res.json(db.prepare('SELECT DISTINCT unit FROM pegawai ORDER BY unit').all().map(r => r.unit));
  });

  // Kenaikan pangkat: hanya reguler = TRUE, tmt_pangkat + 4 tahun
  app.get('/api/kenaikan-pangkat', (_req, res) => {
    const today = todayISO(now());
    const rows = db.prepare(`SELECT * FROM pegawai WHERE reguler = 1 AND tmt_pangkat IS NOT NULL`).all();
    const data = rows
      .map(r => decorate(r, addYears(r.tmt_pangkat, 4), today))
      .sort((a, b) => a.tanggal_selanjutnya.localeCompare(b.tanggal_selanjutnya) || a.nama.localeCompare(b.nama));
    res.json({ today, ringkasan: ringkasan(data), data });
  });

  // Kenaikan gaji berkala: tmt_gaji_terakhir + 2 tahun
  app.get('/api/kenaikan-gaji-berkala', (_req, res) => {
    const today = todayISO(now());
    const rows = db.prepare(`SELECT * FROM pegawai WHERE tmt_gaji_terakhir IS NOT NULL`).all();
    const data = rows
      .map(r => decorate(r, addYears(r.tmt_gaji_terakhir, 2), today))
      .sort((a, b) => a.tanggal_selanjutnya.localeCompare(b.tanggal_selanjutnya) || a.nama.localeCompare(b.nama));
    res.json({ today, ringkasan: ringkasan(data), data });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Tidak ditemukan' }));
  app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Kesalahan server' }); });
  return app;
}

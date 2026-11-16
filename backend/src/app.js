import express from 'express';
import cors from 'cors';
import { requireAdmin, loginLimiter, verifyPassword, hashPassword, signToken, getSecret } from './auth.js';
import { validatePegawai } from './validate.js';
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

export function createApp(db, { now = () => new Date(), jwtSecret = getSecret(db), loginMax = 10 } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  const admin = requireAdmin(jwtSecret, db);

  app.post('/api/auth/login', loginLimiter({ max: loginMax }), (req, res) => {
    const { username, password } = req.body || {};
    const row = typeof username === 'string' && typeof password === 'string'
      ? db.prepare('SELECT * FROM admin WHERE username = ?').get(username) : null;
    if (!row || !verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    req.clearLoginHits?.();
    res.json({ token: signToken(jwtSecret, row), username: row.username });
  });

  app.post('/api/auth/password', admin, loginLimiter({ max: loginMax }), (req, res) => {
    const { current_password: cur, new_password: next } = req.body || {};
    const row = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.admin.id);
    if (typeof cur !== 'string' || !verifyPassword(cur, row.password_hash)) {
      return res.status(400).json({ error: 'Data tidak valid', errors: { current_password: 'Password saat ini salah' } });
    }
    if (typeof next !== 'string' || next.length < 8) {
      return res.status(400).json({ error: 'Data tidak valid', errors: { new_password: 'Password baru minimal 8 karakter' } });
    }
    if (next === cur) {
      return res.status(400).json({ error: 'Data tidak valid', errors: { new_password: 'Password baru harus berbeda' } });
    }
    const hash = hashPassword(next);
    db.prepare('UPDATE admin SET password_hash = ? WHERE id = ?').run(hash, row.id);
    // token baru agar sesi ini tetap aktif; token lain (perangkat lain) menjadi tidak berlaku
    res.json({ token: signToken(jwtSecret, { ...row, password_hash: hash }), username: row.username });
  });

  app.get('/api/auth/me', admin, (req, res) => res.json({ username: req.admin.username }));

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

  const save = (id) => (req, res) => {
    const { value, errors } = validatePegawai(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Data tidak valid', errors });
    try {
      if (id(req) === null) {
        const cols = Object.keys(value);
        const r = db.prepare(`INSERT INTO pegawai (${cols.join(',')}) VALUES (${cols.map(c => '@' + c).join(',')})`).run(value);
        return res.status(201).json(getOne(r.lastInsertRowid));
      }
      const cols = Object.keys(value).map(c => `${c} = @${c}`).join(', ');
      const r = db.prepare(`UPDATE pegawai SET ${cols} WHERE id = @id`).run({ ...value, id: id(req) });
      if (!r.changes) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
      res.json(getOne(id(req)));
    } catch (e) {
      if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'Data tidak valid', errors: { nip: 'NIP sudah terdaftar' } });
      throw e;
    }
  };
  const getOne = (id) => { const r = db.prepare('SELECT * FROM pegawai WHERE id = ?').get(id); return { ...r, reguler: !!r.reguler }; };
  const paramId = req => (/^\d+$/.test(req.params.id) ? Number(req.params.id) : -1);

  app.post('/api/pegawai', admin, save(() => null));
  app.put('/api/pegawai/:id', admin, save(paramId));
  app.delete('/api/pegawai/:id', admin, (req, res) => {
    const r = db.prepare('DELETE FROM pegawai WHERE id = ?').run(paramId(req));
    if (!r.changes) return res.status(404).json({ error: 'Pegawai tidak ditemukan' });
    res.status(204).end();
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

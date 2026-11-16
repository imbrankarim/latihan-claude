import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from './db.js';
import { createApp } from './app.js';
import { addYears, statusJatuhTempo } from './dates.js';

function setup() {
  const db = openDb(':memory:');
  const ins = db.prepare(`INSERT INTO pegawai (nip,nama,status_kepegawaian,tmt_pangkat,reguler,tmt_gaji_terakhir,unit) VALUES (?,?,?,?,?,?,?)`);
  ins.run('1', 'A', 'PNS', '2023-04-01', 1, '2024-12-01', 'U');
  ins.run('2', 'B', 'PNS', '2022-04-01', 0, '2024-10-01', 'U'); // non-reguler
  ins.run('3', 'C', 'PPPK', null, 0, '2026-09-01', 'U');
  return createApp(db, { now: () => new Date('2026-11-16T00:00:00Z') });
}
async function get(app, url) {
  const s = app.listen(0);
  try { return await (await fetch(`http://localhost:${s.address().port}${url}`)).json(); } finally { s.close(); }
}

test('kenaikan pangkat hanya reguler, +4 tahun', async () => {
  const r = await get(setup(), '/api/kenaikan-pangkat');
  assert.equal(r.data.length, 1);
  assert.equal(r.data[0].tanggal_selanjutnya, '2027-04-01');
  assert.equal(r.data[0].status, 'tahun_ini');
});

test('KGB +2 tahun untuk semua pegawai', async () => {
  const r = await get(setup(), '/api/kenaikan-gaji-berkala');
  assert.deepEqual(r.data.map(d => d.tanggal_selanjutnya), ['2026-10-01', '2026-12-01', '2028-09-01']);
  assert.deepEqual(r.data.map(d => d.status), ['terlambat', 'segera', 'belum']);
});

test('util tanggal', () => {
  assert.equal(addYears('2024-12-01', 2), '2026-12-01');
  assert.equal(statusJatuhTempo('2026-11-16', '2026-11-16'), 'terlambat');
});

// ---- Auth & CRUD ----
import { hashPassword } from './auth.js';
function setupAuth() {
  const db = openDb(':memory:');
  db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run('admin', hashPassword('rahasia123'));
  return createApp(db, { jwtSecret: 's', loginMax: 3 });
}
async function call(app, method, url, body, token) {
  const s = app.listen(0);
  try {
    const res = await fetch(`http://localhost:${s.address().port}${url}`, {
      method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  } finally { s.close(); }
}
const pegawai = { nip: '198001012005011001', nama: 'Budi', status_kepegawaian: 'PNS', pangkat: 'Penata', tmt_pangkat: '2024-04-01',
  golongan: 'III/c', tmt_gaji_terakhir: '2025-03-01', reguler: true, unit: 'U' };

test('login & proteksi endpoint tulis', async () => {
  const app = setupAuth();
  assert.equal((await call(app, 'POST', '/api/pegawai', pegawai)).status, 401);
  assert.equal((await call(app, 'POST', '/api/auth/login', { username: 'admin', password: 'salah' })).status, 401);
  const { body } = await call(app, 'POST', '/api/auth/login', { username: 'admin', password: 'rahasia123' });
  assert.ok(body.token);
  assert.equal((await call(app, 'GET', '/api/auth/me', null, body.token)).body.username, 'admin');
});

test('tambah, edit, hapus + validasi', async () => {
  const app = setupAuth();
  const { body: { token } } = await call(app, 'POST', '/api/auth/login', { username: 'admin', password: 'rahasia123' });
  const bad = await call(app, 'POST', '/api/pegawai', { ...pegawai, nip: '123' }, token);
  assert.equal(bad.status, 400); assert.ok(bad.body.errors.nip);
  const ok = await call(app, 'POST', '/api/pegawai', pegawai, token);
  assert.equal(ok.status, 201);
  assert.equal((await call(app, 'POST', '/api/pegawai', pegawai, token)).status, 409);
  const upd = await call(app, 'PUT', `/api/pegawai/${ok.body.id}`, { ...pegawai, nama: 'Budi S' }, token);
  assert.equal(upd.body.nama, 'Budi S');
  // PPPK: pangkat dikosongkan, keluar dari kenaikan pangkat
  const pppk = await call(app, 'PUT', `/api/pegawai/${ok.body.id}`, { ...pegawai, status_kepegawaian: 'PPPK' }, token);
  assert.equal(pppk.body.pangkat, null); assert.equal(pppk.body.reguler, false);
  assert.equal((await call(app, 'DELETE', `/api/pegawai/${ok.body.id}`, null, token)).status, 204);
  assert.equal((await call(app, 'DELETE', `/api/pegawai/${ok.body.id}`, null, token)).status, 404);
});

test('login dibatasi setelah terlalu banyak percobaan', async () => {
  const app = setupAuth(); let last;
  for (let i = 0; i < 4; i++) last = await call(app, 'POST', '/api/auth/login', { username: 'admin', password: 'x' });
  assert.equal(last.status, 429);
});

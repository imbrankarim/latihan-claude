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

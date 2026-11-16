import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(dir, '..', 'data', 'pegawai.json'), 'utf8'));
const db = openDb();
const cols = ['nip','nama','tempat_lahir','tanggal_lahir','jenis_kelamin','agama','status_kawin','status_kepegawaian','pangkat','tmt_pangkat','golongan','jabatan','tmt_cpns','tmt_gaji_terakhir','reguler','unit_kerja','unit'];
const ins = db.prepare(`INSERT INTO pegawai (${cols.join(',')}) VALUES (${cols.map(c => '@' + c).join(',')})`);
db.transaction(() => {
  db.prepare('DELETE FROM pegawai').run();
  for (const p of data) ins.run({ ...p, reguler: p.reguler ? 1 : 0 });
})();
console.log(`Seed selesai: ${data.length} pegawai`);

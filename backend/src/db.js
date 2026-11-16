import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
export const DB_PATH = process.env.DB_PATH || path.join(dir, '..', 'data', 'kepegawaian.db');

export function openDb(file = DB_PATH) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS pegawai (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nip TEXT NOT NULL UNIQUE,
      nama TEXT NOT NULL,
      tempat_lahir TEXT,
      tanggal_lahir TEXT,
      jenis_kelamin TEXT,
      agama TEXT,
      status_kawin TEXT,
      status_kepegawaian TEXT NOT NULL CHECK (status_kepegawaian IN ('PNS','PPPK')),
      pangkat TEXT,
      tmt_pangkat TEXT,
      golongan TEXT,
      jabatan TEXT,
      tmt_cpns TEXT,
      tmt_gaji_terakhir TEXT,
      reguler INTEGER NOT NULL DEFAULT 0,
      unit_kerja TEXT,
      unit TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_pegawai_unit ON pegawai(unit);
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  return db;
}

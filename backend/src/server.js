import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { openDb } from './db.js';
import { createApp } from './app.js';

const db = openDb();
if (db.prepare('SELECT COUNT(*) c FROM pegawai').get().c === 0) await import('./seed.js');

const app = createApp(db);
// Produksi: sajikan hasil build frontend bila ada
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));

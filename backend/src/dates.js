// Semua tanggal berupa string ISO 'YYYY-MM-DD' (TMT selalu tanggal 1).
export function addYears(iso, years) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(y + years).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function todayISO(now = new Date()) {
  // Zona waktu Wita (UTC+8) — Sulawesi Tenggara
  const wita = new Date(now.getTime() + 8 * 3600 * 1000);
  return wita.toISOString().slice(0, 10);
}

export function monthsBetween(fromIso, toIso) {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  let m = (ty - fy) * 12 + (tm - fm);
  if (td < fd) m -= 1;
  return m;
}

// status jatuh tempo relatif terhadap hari ini
export function statusJatuhTempo(tanggal, today) {
  if (tanggal <= today) return 'terlambat';           // TMT sudah lewat/tiba, belum diproses
  const bulan = monthsBetween(today, tanggal);
  if (bulan < 3) return 'segera';                       // < 3 bulan lagi
  if (bulan < 12) return 'tahun_ini';                   // < 12 bulan lagi
  return 'belum';
}

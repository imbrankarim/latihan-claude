export async function api(path) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`Gagal memuat data (${res.status})`);
  return res.json();
}

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
export function tgl(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}
export function bulanTahun(iso) {
  if (!iso) return '—';
  const [y, m] = iso.split('-').map(Number);
  return `${BULAN[m - 1]} ${y}`;
}
export function sisaLabel(bulan) {
  if (bulan <= 0) return `Lewat ${Math.abs(bulan) || 0} bln`;
  if (bulan < 12) return `${bulan} bulan lagi`;
  const t = Math.floor(bulan / 12), b = bulan % 12;
  return `${t} thn${b ? ` ${b} bln` : ''} lagi`;
}

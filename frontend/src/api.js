import { reactive } from 'vue';

// Sesi admin (token disimpan di localStorage; tetap berfungsi bila storage diblokir)
export const auth = reactive({ token: read(), username: read('username') });
function read(k = 'token') { try { return localStorage.getItem(k); } catch { return null; } }
export function setSession(token, username) {
  auth.token = token; auth.username = username;
  try {
    if (token) { localStorage.setItem('token', token); localStorage.setItem('username', username); }
    else { localStorage.removeItem('token'); localStorage.removeItem('username'); }
  } catch { /* abaikan */ }
}

export class ApiError extends Error {
  constructor(message, status, errors) { super(message); this.status = status; this.errors = errors || {}; }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth.token) setSession(null); // token kedaluwarsa
    throw new ApiError(data.error || `Gagal memuat data (${res.status})`, res.status, data.errors);
  }
  return data;
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

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isDate = v => ISO.test(v) && !Number.isNaN(Date.parse(v));
const GOL = /^(I{1,3}|IV)\/[a-e]$|^(I{1,3}|IV|V|VI{0,3}|IX|X|XI{0,3}|XIV|XV|XVI{0,2})$/;

const blank = v => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const str = v => (blank(v) ? null : String(v).trim());

// Mengembalikan { value, errors }
export function validatePegawai(body = {}) {
  const errors = {};
  const v = {
    nip: str(body.nip), nama: str(body.nama), tempat_lahir: str(body.tempat_lahir), tanggal_lahir: str(body.tanggal_lahir),
    jenis_kelamin: str(body.jenis_kelamin), agama: str(body.agama), status_kawin: str(body.status_kawin),
    status_kepegawaian: str(body.status_kepegawaian), pangkat: str(body.pangkat), tmt_pangkat: str(body.tmt_pangkat),
    golongan: str(body.golongan), jabatan: str(body.jabatan), tmt_cpns: str(body.tmt_cpns),
    tmt_gaji_terakhir: str(body.tmt_gaji_terakhir), reguler: body.reguler === true || body.reguler === 1 ? 1 : 0,
    unit_kerja: str(body.unit_kerja), unit: str(body.unit),
  };

  if (!v.nip || !/^\d{18}$/.test(v.nip)) errors.nip = 'NIP harus 18 digit angka';
  if (!v.nama) errors.nama = 'Nama wajib diisi';
  if (!['PNS', 'PPPK'].includes(v.status_kepegawaian)) errors.status_kepegawaian = 'Pilih PNS atau PPPK';
  if (!['Laki-Laki', 'Perempuan', null].includes(v.jenis_kelamin)) errors.jenis_kelamin = 'Tidak valid';
  for (const f of ['tanggal_lahir', 'tmt_pangkat', 'tmt_cpns', 'tmt_gaji_terakhir']) {
    if (v[f] && !isDate(v[f])) errors[f] = 'Format tanggal harus YYYY-MM-DD';
  }
  if (!v.tmt_gaji_terakhir) errors.tmt_gaji_terakhir = 'TMT gaji terakhir wajib diisi';
  if (v.golongan && !GOL.test(v.golongan)) errors.golongan = 'Golongan tidak valid (contoh: III/b atau IX)';

  if (v.status_kepegawaian === 'PNS') {
    if (!v.pangkat) errors.pangkat = 'Pangkat wajib untuk PNS';
    if (!v.tmt_pangkat) errors.tmt_pangkat = 'TMT pangkat wajib untuk PNS';
  } else {
    // PPPK tidak memiliki pangkat dan tidak ikut kenaikan pangkat
    v.pangkat = null; v.tmt_pangkat = null; v.reguler = 0;
  }
  return { value: v, errors };
}

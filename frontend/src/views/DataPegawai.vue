<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { api, tgl, bulanTahun } from '../api.js';

const data = ref([]), units = ref([]), loading = ref(true), error = ref('');
const q = ref(''), unit = ref(''), status = ref(''), detail = ref(null);

async function load() {
  loading.value = true;
  try {
    const p = new URLSearchParams();
    if (q.value) p.set('q', q.value);
    if (unit.value) p.set('unit', unit.value);
    if (status.value) p.set('status', status.value);
    data.value = (await api(`/pegawai?${p}`)).data; error.value = '';
  } catch (e) { error.value = e.message; } finally { loading.value = false; }
}
let t;
watch(q, () => { clearTimeout(t); t = setTimeout(load, 250); });
watch([unit, status], load);
onMounted(async () => { units.value = await api('/unit'); load(); });

const fields = computed(() => !detail.value ? [] : [
  ['NIP', detail.value.nip], ['Tempat, tanggal lahir', `${detail.value.tempat_lahir}, ${tgl(detail.value.tanggal_lahir)}`],
  ['Jenis kelamin', detail.value.jenis_kelamin], ['Agama', detail.value.agama], ['Status kawin', detail.value.status_kawin],
  ['Status kepegawaian', detail.value.status_kepegawaian], ['Pangkat', detail.value.pangkat || '—'], ['Golongan', detail.value.golongan],
  ['TMT pangkat', tgl(detail.value.tmt_pangkat)], ['TMT CPNS/CPPPK', tgl(detail.value.tmt_cpns)],
  ['TMT gaji terakhir', tgl(detail.value.tmt_gaji_terakhir)], ['Jabatan', detail.value.jabatan], ['Unit', detail.value.unit], ['Unit kerja', detail.value.unit_kerja],
]);
</script>

<template>
  <h1>Data Pegawai</h1>
  <div class="filters">
    <input v-model="q" type="search" placeholder="Cari nama, NIP, atau jabatan…" />
    <select v-model="unit"><option value="">Semua unit</option><option v-for="u in units" :key="u">{{ u }}</option></select>
    <select v-model="status"><option value="">PNS &amp; PPPK</option><option>PNS</option><option>PPPK</option></select>
    <span class="muted">{{ data.length }} pegawai</span>
  </div>
  <p v-if="error" class="error">{{ error }}</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>No</th><th>Nama / NIP</th><th>Pangkat / Gol.</th><th>Jabatan</th><th>Unit</th><th>TMT Pangkat</th><th></th></tr></thead>
      <tbody>
        <tr v-for="(d, i) in data" :key="d.nip">
          <td>{{ i + 1 }}</td>
          <td><strong>{{ d.nama }}</strong><small>{{ d.nip }}</small></td>
          <td>{{ d.pangkat || d.status_kepegawaian }}<small>{{ d.golongan }}</small></td>
          <td>{{ d.jabatan }}</td><td>{{ d.unit }}</td><td>{{ bulanTahun(d.tmt_pangkat) }}</td>
          <td><button class="link" @click="detail = d">Detail</button></td>
        </tr>
        <tr v-if="!loading && !data.length"><td colspan="7" class="empty">Tidak ada data.</td></tr>
      </tbody>
    </table>
  </div>

  <div v-if="detail" class="overlay" @click.self="detail = null">
    <div class="modal" role="dialog" aria-modal="true">
      <button class="close" aria-label="Tutup" @click="detail = null">×</button>
      <h2>{{ detail.nama }}</h2>
      <dl><template v-for="[k, v] in fields" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></template></dl>
    </div>
  </div>
</template>

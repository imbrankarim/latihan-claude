<script setup>
import { ref, computed, onMounted } from 'vue';
import { api, tgl, bulanTahun, sisaLabel } from '../api.js';
import StatusBadge from './StatusBadge.vue';

const props = defineProps({
  endpoint: String,
  judul: String,
  keterangan: String,
  tmtLabel: String,        // label kolom TMT asal
  tmtField: String,        // field TMT asal
  tujuanLabel: String,     // label kolom tanggal selanjutnya
  showPangkat: Boolean,
});

const state = ref({ loading: true, error: '', today: '', ringkasan: null, data: [] });
const filter = ref('semua');
const q = ref('');

onMounted(async () => {
  try {
    const r = await api(props.endpoint);
    state.value = { loading: false, error: '', ...r };
  } catch (e) { state.value.loading = false; state.value.error = e.message; }
});

const cards = computed(() => {
  const r = state.value.ringkasan; if (!r) return [];
  return [
    { key: 'semua', label: 'Semua', n: r.total },
    { key: 'terlambat', label: 'Jatuh tempo', n: r.terlambat },
    { key: 'segera', label: '< 3 bulan', n: r.segera },
    { key: 'tahun_ini', label: '< 1 tahun', n: r.tahun_ini },
    { key: 'belum', label: 'Belum waktunya', n: r.belum },
  ];
});
const rows = computed(() => state.value.data.filter(d =>
  (filter.value === 'semua' || d.status === filter.value) &&
  (!q.value || `${d.nama} ${d.nip}`.toLowerCase().includes(q.value.toLowerCase()))));
</script>

<template>
  <h1>{{ judul }}</h1>
  <p class="muted">{{ keterangan }} Acuan tanggal hari ini: <strong>{{ tgl(state.today) }}</strong>.</p>
  <p v-if="state.loading">Memuat…</p>
  <p v-else-if="state.error" class="error">{{ state.error }}</p>
  <template v-else>
    <div class="cards">
      <button v-for="c in cards" :key="c.key" class="card" :class="[c.key, { active: filter === c.key }]" @click="filter = c.key">
        <span class="n">{{ c.n }}</span><span>{{ c.label }}</span>
      </button>
    </div>
    <input v-model="q" class="search" type="search" placeholder="Cari nama atau NIP…" />
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>No</th><th>Nama / NIP</th><th>Jabatan</th><th v-if="showPangkat">Pangkat / Gol.</th><th v-else>Gol.</th>
            <th>{{ tmtLabel }}</th><th>{{ tujuanLabel }}</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(d, i) in rows" :key="d.nip">
            <td>{{ i + 1 }}</td>
            <td><strong>{{ d.nama }}</strong><small>{{ d.nip }}</small></td>
            <td>{{ d.jabatan }}<small>{{ d.unit }}</small></td>
            <td v-if="showPangkat">{{ d.pangkat }}<small>{{ d.golongan }}</small></td>
            <td v-else>{{ d.golongan }}<small>{{ d.status_kepegawaian }}</small></td>
            <td>{{ bulanTahun(d[tmtField]) }}</td>
            <td><strong>{{ bulanTahun(d.tanggal_selanjutnya) }}</strong><small>{{ sisaLabel(d.sisa_bulan) }}</small></td>
            <td><StatusBadge :status="d.status" /></td>
          </tr>
          <tr v-if="!rows.length"><td colspan="8" class="empty">Tidak ada data.</td></tr>
        </tbody>
      </table>
    </div>
  </template>
</template>

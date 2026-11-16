<script setup>
import { reactive, ref, computed } from 'vue';
import { api, ApiError } from '../api.js';

const props = defineProps({ pegawai: Object, units: Array });
const emit = defineEmits(['saved', 'close']);

const kosong = {
  nip: '', nama: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: 'Laki-Laki', agama: 'Islam', status_kawin: 'Belum Kawin',
  status_kepegawaian: 'PNS', pangkat: '', tmt_pangkat: '', golongan: '', jabatan: '', tmt_cpns: '', tmt_gaji_terakhir: '',
  reguler: true, unit_kerja: 'Kantor Wilayah Kementerian HAM Sulawesi Selatan Wilayah Kerja Sulawesi Tenggara', unit: '',
};
const f = reactive({ ...kosong, ...Object.fromEntries(Object.entries(props.pegawai || {}).map(([k, v]) => [k, v ?? ''])) });
const errors = ref({}), error = ref(''), busy = ref(false);
const pns = computed(() => f.status_kepegawaian === 'PNS');
const edit = !!props.pegawai;

async function submit() {
  busy.value = true; error.value = ''; errors.value = {};
  try {
    const saved = await api(edit ? `/pegawai/${props.pegawai.id}` : '/pegawai', { method: edit ? 'PUT' : 'POST', body: { ...f } });
    emit('saved', saved);
  } catch (e) {
    error.value = e.message;
    if (e instanceof ApiError) errors.value = e.errors;
  } finally { busy.value = false; }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form class="modal wide" @submit.prevent="submit" role="dialog" aria-modal="true">
      <button type="button" class="close" aria-label="Tutup" @click="emit('close')">×</button>
      <h2>{{ edit ? 'Edit Pegawai' : 'Tambah Pegawai' }}</h2>
      <div class="grid">
        <label>NIP<input v-model="f.nip" inputmode="numeric" maxlength="18" required /><em v-if="errors.nip">{{ errors.nip }}</em></label>
        <label>Nama<input v-model="f.nama" required /><em v-if="errors.nama">{{ errors.nama }}</em></label>
        <label>Tempat lahir<input v-model="f.tempat_lahir" /></label>
        <label>Tanggal lahir<input v-model="f.tanggal_lahir" type="date" /><em v-if="errors.tanggal_lahir">{{ errors.tanggal_lahir }}</em></label>
        <label>Jenis kelamin<select v-model="f.jenis_kelamin"><option>Laki-Laki</option><option>Perempuan</option></select></label>
        <label>Agama<select v-model="f.agama"><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option></select></label>
        <label>Status kawin<select v-model="f.status_kawin"><option>Belum Kawin</option><option>Kawin</option><option>Cerai Hidup</option><option>Cerai Mati</option></select></label>
        <label>Status kepegawaian<select v-model="f.status_kepegawaian"><option>PNS</option><option>PPPK</option></select></label>
        <label v-if="pns">Pangkat<input v-model="f.pangkat" placeholder="mis. Penata Tk. I" /><em v-if="errors.pangkat">{{ errors.pangkat }}</em></label>
        <label v-if="pns">TMT pangkat<input v-model="f.tmt_pangkat" type="date" /><em v-if="errors.tmt_pangkat">{{ errors.tmt_pangkat }}</em></label>
        <label>Golongan<input v-model="f.golongan" :placeholder="pns ? 'mis. III/d' : 'mis. IX'" /><em v-if="errors.golongan">{{ errors.golongan }}</em></label>
        <label>Jabatan<input v-model="f.jabatan" /></label>
        <label>TMT CPNS/CPPPK<input v-model="f.tmt_cpns" type="date" /><em v-if="errors.tmt_cpns">{{ errors.tmt_cpns }}</em></label>
        <label>TMT gaji terakhir<input v-model="f.tmt_gaji_terakhir" type="date" required /><em v-if="errors.tmt_gaji_terakhir">{{ errors.tmt_gaji_terakhir }}</em></label>
        <label>Unit<input v-model="f.unit" list="daftar-unit" /><datalist id="daftar-unit"><option v-for="u in units" :key="u" :value="u" /></datalist></label>
        <label class="full">Unit kerja<input v-model="f.unit_kerja" /></label>
        <label v-if="pns" class="check full"><input v-model="f.reguler" type="checkbox" /> Jalur reguler (masuk daftar Kenaikan Pangkat)</label>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="actions">
        <button type="button" class="btn" @click="emit('close')">Batal</button>
        <button class="btn primary" :disabled="busy">{{ busy ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
    </form>
  </div>
</template>

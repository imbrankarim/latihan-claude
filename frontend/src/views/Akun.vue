<script setup>
import { ref } from 'vue';
import { api, auth, setSession, ApiError } from '../api.js';

const cur = ref(''), next = ref(''), confirm = ref('');
const errors = ref({}), error = ref(''), ok = ref(false), busy = ref(false);

async function submit() {
  errors.value = {}; error.value = ''; ok.value = false;
  if (next.value !== confirm.value) { errors.value = { confirm: 'Konfirmasi tidak sama dengan password baru' }; return; }
  busy.value = true;
  try {
    const r = await api('/auth/password', { method: 'POST', body: { current_password: cur.value, new_password: next.value } });
    setSession(r.token, r.username);
    cur.value = next.value = confirm.value = ''; ok.value = true;
  } catch (e) {
    error.value = e.message;
    if (e instanceof ApiError && e.status !== 401) errors.value = e.errors;
  } finally { busy.value = false; }
}
</script>

<template>
  <form class="login" @submit.prevent="submit">
    <h1>Ganti Password</h1>
    <p class="muted">Akun: <strong>{{ auth.username }}</strong>. Setelah diganti, sesi di perangkat lain otomatis keluar.</p>
    <label>Password saat ini<input v-model="cur" type="password" autocomplete="current-password" required /><em v-if="errors.current_password">{{ errors.current_password }}</em></label>
    <label>Password baru (min. 8 karakter)<input v-model="next" type="password" autocomplete="new-password" minlength="8" required /><em v-if="errors.new_password">{{ errors.new_password }}</em></label>
    <label>Ulangi password baru<input v-model="confirm" type="password" autocomplete="new-password" required /><em v-if="errors.confirm">{{ errors.confirm }}</em></label>
    <p v-if="error && !Object.keys(errors).length" class="error" role="alert">{{ error }}</p>
    <p v-if="ok" class="success" role="status">Password berhasil diganti.</p>
    <button class="btn primary" :disabled="busy">{{ busy ? 'Menyimpan…' : 'Simpan' }}</button>
  </form>
</template>

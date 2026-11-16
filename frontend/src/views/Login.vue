<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { api, setSession } from '../api.js';

const router = useRouter(), route = useRoute();
const username = ref(''), password = ref(''), error = ref(''), busy = ref(false);

async function submit() {
  busy.value = true; error.value = '';
  try {
    const r = await api('/auth/login', { method: 'POST', body: { username: username.value, password: password.value } });
    setSession(r.token, r.username);
    router.push(route.query.redirect || '/pegawai');
  } catch (e) { error.value = e.message; } finally { busy.value = false; }
}
</script>

<template>
  <form class="login" @submit.prevent="submit">
    <h1>Login Admin</h1>
    <p class="muted">Khusus admin untuk mengelola data pegawai.</p>
    <label>Username<input v-model="username" autocomplete="username" required autofocus /></label>
    <label>Password<input v-model="password" type="password" autocomplete="current-password" required /></label>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="btn primary" :disabled="busy">{{ busy ? 'Memproses…' : 'Masuk' }}</button>
  </form>
</template>

<script setup>
const nav = [
  { to: '/pegawai', label: 'Data Pegawai' },
  { to: '/kenaikan-pangkat', label: 'Kenaikan Pangkat' },
  { to: '/kenaikan-gaji-berkala', label: 'Kenaikan Gaji Berkala' },
];
</script>

<template>
  <header class="top">
    <div class="wrap bar">
      <div class="brand">
        <strong>Layanan Kepegawaian</strong>
        <span>Kementerian Hak Asasi Manusia · Wilayah Kerja Sulawesi Tenggara</span>
      </div>
      <nav>
        <router-link v-for="n in nav" :key="n.to" :to="n.to">{{ n.label }}</router-link>
      </nav>
    </div>
  </header>
  <main class="wrap"><router-view /></main>
</template>

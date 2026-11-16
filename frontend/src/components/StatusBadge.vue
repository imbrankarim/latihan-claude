<script setup>
defineProps({ status: String });
const label = { terlambat: 'Jatuh tempo', segera: '< 3 bulan', tahun_ini: '< 1 tahun', belum: 'Belum waktunya' };
</script>
<template><span class="badge" :class="status">{{ label[status] }}</span></template>

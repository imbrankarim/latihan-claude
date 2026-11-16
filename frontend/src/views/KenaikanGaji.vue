<script setup>
import KenaikanTable from '../components/KenaikanTable.vue';
</script>
<template>
  <KenaikanTable endpoint="/kenaikan-gaji-berkala" judul="Kenaikan Gaji Berkala"
    keterangan="TMT KGB berikutnya = TMT gaji terakhir + 2 tahun."
    tmt-label="TMT Gaji Terakhir" tmt-field="tmt_gaji_terakhir" tujuan-label="KGB Selanjutnya" />
</template>

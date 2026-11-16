<script setup>
import KenaikanTable from '../components/KenaikanTable.vue';
</script>
<template>
  <KenaikanTable endpoint="/kenaikan-pangkat" judul="Kenaikan Pangkat Selanjutnya"
    keterangan="Pegawai PNS dengan jalur reguler; TMT pangkat berikutnya = TMT pangkat saat ini + 4 tahun."
    tmt-label="TMT Pangkat Saat Ini" tmt-field="tmt_pangkat" tujuan-label="Kenaikan Pangkat Selanjutnya" show-pangkat />
</template>

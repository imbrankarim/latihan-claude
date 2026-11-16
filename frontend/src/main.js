import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './style.css';
import DataPegawai from './views/DataPegawai.vue';
import KenaikanPangkat from './views/KenaikanPangkat.vue';
import KenaikanGaji from './views/KenaikanGaji.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/pegawai' },
    { path: '/pegawai', component: DataPegawai, meta: { title: 'Data Pegawai' } },
    { path: '/kenaikan-pangkat', component: KenaikanPangkat, meta: { title: 'Kenaikan Pangkat Selanjutnya' } },
    { path: '/kenaikan-gaji-berkala', component: KenaikanGaji, meta: { title: 'Kenaikan Gaji Berkala' } },
  ],
});
router.afterEach(to => { document.title = `${to.meta.title} — Layanan Kepegawaian`; });
createApp(App).use(router).mount('#app');

import './assets/main.css';
import "primeicons/primeicons.css";

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import App from './App.vue';
import router from './router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';

import Aura from '@primevue/themes/aura';

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
});

app.component('Button', Button);
app.component('InputText', InputText);
app.component('Password', Password);

app.use(createPinia());
app.use(router);

app.mount('#app');
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
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';

import MultiSelect from 'primevue/multiselect';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import DataView from 'primevue/dataview';
import Paginator from 'primevue/paginator';
import ToggleButton from 'primevue/togglebutton';
import SelectButton from 'primevue/selectbutton'
import AutoComplete from 'primevue/autocomplete';
import Chip from 'primevue/chip';

import Aura from '@primevue/themes/aura';

const app = createApp(App);

app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
});
app.use(ToastService);

app.component('Button', Button);
app.component('InputText', InputText);
app.component('Password', Password);
app.component('Toast', Toast);
app.component('SelectButton', SelectButton)
app.component('Chip', Chip);

app.component('MultiSelect', MultiSelect);
app.component('InputNumber', InputNumber);
app.component('Dropdown', Dropdown);
app.component('DataView', DataView);
app.component('Paginator', Paginator);
app.component('ToggleButton', ToggleButton);
app.component('AutoComplete', AutoComplete); 

app.use(createPinia());
app.use(router);

app.mount('#app');
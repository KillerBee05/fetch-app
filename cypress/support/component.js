import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from '../../src/App.vue'

// Global setup for component tests
export const mountingOptions = {
  global: {
    plugins: [PrimeVue]
  }
}

// Create app instance
const app = createApp(App)
app.use(PrimeVue)
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/userStore'

// Создаем приложение
const app = createApp(App)

// Создаем Pinia
const pinia = createPinia()
app.use(pinia)

// Подключаем роутер
app.use(router)

// Проверяем авторизацию при загрузке
const userStore = useUserStore(pinia)
userStore.checkAuth()

// Монтируем приложение
app.mount('#app')
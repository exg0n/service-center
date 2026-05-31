<template>
  <div class="home-page fade-in">
    <!-- Hero секция -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-title">Сервисный центр</h1>
        <p class="hero-subtitle">Профессиональный ремонт цифровой техники</p>
        
        <div class="hero-actions">
          <ChocolateButton @click="goToOrder" variant="primary">
            Оформить заявку
          </ChocolateButton>
          <ChocolateButton @click="goToStatus" variant="outline">
            Проверить статус
          </ChocolateButton>
        </div>
      </div>
    </section>

    <!-- Карточки с услугами -->
    <section class="services">
      <div class="container">
        <h2 class="section-title">Наши услуги</h2>
        
        <div v-if="serviceStore.loading" class="loading">
          Загрузка услуг...
        </div>
        
        <div v-else class="services-grid">
          <ChocolateCard 
            v-for="service in serviceStore.services" 
            :key="service.id"
            :title="service.name"
            clickable
            @click="goToOrderWithService(service)"
          >
            <p>{{ service.description }}</p>
            <p class="service-price">{{ service.price }} ₽</p>
          </ChocolateCard>
        </div>
      </div>
    </section>

    <!-- Преимущества -->
    <section class="features">
      <div class="container">
        <div class="features-grid">
          <div v-for="feature in features" :key="feature.title" class="feature-item">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServiceStore } from '../stores/serviceStore'
import { useUserStore } from '../stores/userStore'
import ChocolateButton from './ui/ChocolateButton.vue'
import ChocolateCard from './ui/ChocolateCard.vue'

const router = useRouter()
const userStore = useUserStore()
const serviceStore = useServiceStore()

const features = [
  { title: 'Быстро', description: 'Среднее время ремонта - 2 часа' },
  { title: 'Качественно', description: 'Оригинальные запчасти и гарантия' },
  { title: 'Удобно', description: 'Статус заказа в личном кабинете' }
]

// Загружаем услуги при монтировании
onMounted(() => {
  serviceStore.fetchServices()
})

// Переход на страницу оформления заказа
const goToOrder = () => {
  if (userStore.isAuthenticated) {
    router.push('/order')
  } else {
    router.push({
      path: '/login',
      query: { redirect: '/order' }
    })
  }
}

// Переход на страницу проверки статуса
const goToStatus = () => {
  router.push('/status')
}

// Переход на страницу оформления заказа с выбранной услугой
const goToOrderWithService = (service) => {
  if (userStore.isAuthenticated) {
    router.push({
      path: '/order',
      query: { service: service.id }
    })
  } else {
    router.push({
      path: '/login',
      query: { redirect: '/order', service: service.id }
    })
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* Hero секция */
.hero {
  background: linear-gradient(135deg, var(--chocolate-50) 0%, var(--chocolate-100) 100%);
  padding: 80px 0;
  text-align: center;
}

.hero-title {
  font-size: 48px;
  color: var(--chocolate-800);
  margin-bottom: 16px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 20px;
  color: var(--chocolate-600);
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* Секция услуг */
.services {
  padding: 60px 0;
  background-color: white;
}

.section-title {
  text-align: center;
  font-size: 36px;
  color: var(--chocolate-800);
  margin-bottom: 40px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.service-price {
  font-size: 20px;
  font-weight: 600;
  color: var(--chocolate-700);
  margin-top: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--chocolate-500);
  font-size: 18px;
}

/* Преимущества */
.features {
  background-color: var(--chocolate-50);
  padding: 60px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  text-align: center;
}

.feature-item h3 {
  color: var(--chocolate-700);
  margin-bottom: 8px;
  font-size: 20px;
}

.feature-item p {
  color: var(--chocolate-500);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }
  
  .hero-subtitle {
    font-size: 18px;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .hero-actions .chocolate-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .section-title {
    font-size: 28px;
  }
}
</style>
<template>
  <div class="services-page container">
    <h1 class="page-title">Наши услуги</h1>
    
    <div v-if="serviceStore.loading" class="loading">
      Загрузка услуг...
    </div>
    
    <div v-else class="services-grid">
      <ChocolateCard 
        v-for="service in serviceStore.services" 
        :key="service.id"
        :title="service.name"
        class="service-card"
      >
        <p class="service-description">{{ service.description }}</p>
        <p class="service-price">от {{ service.price }} ₽</p>
        
        <template #footer>
          <ChocolateButton 
            variant="primary" 
            :fullWidth="true" 
            @click="orderService(service)"
          >
            Заказать
          </ChocolateButton>
        </template>
      </ChocolateCard>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServiceStore } from '../stores/serviceStore'
import { useUserStore } from '../stores/userStore'
import ChocolateCard from './ui/ChocolateCard.vue'
import ChocolateButton from './ui/ChocolateButton.vue'

const router = useRouter()
const userStore = useUserStore()
const serviceStore = useServiceStore()

onMounted(() => {
  serviceStore.fetchServices()
})

const orderService = (service) => {
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
.services-page {
  padding: 40px 0;
}

.page-title {
  color: var(--chocolate-700);
  margin-bottom: 30px;
  font-size: 32px;
  text-align: center;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.service-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.service-description {
  color: var(--chocolate-500);
  margin-bottom: 16px;
  line-height: 1.5;
  flex: 1;
}

.service-price {
  font-size: 20px;
  font-weight: 600;
  color: var(--chocolate-700);
  margin-top: auto;
  margin-bottom: 16px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: var(--chocolate-500);
  font-size: 18px;
}
</style>
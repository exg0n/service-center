<template>
  <div class="status-page container">
    <h1 class="page-title">Статус заказа</h1>
    
    <div class="status-form">
      <div class="input-container">
        <ChocolateInput
          id="orderNumber"
          v-model="searchOrderNumber"
          label="Номер заказа"
          placeholder="Введите номер заказа (например: ORD-2026-0002)"
          :error="searchError"
        />
      </div>
      
      <div class="button-container">
        <ChocolateButton 
          @click="searchOrder" 
          variant="primary"
          :disabled="loading || !searchOrderNumber"
        >
          <span v-if="loading" class="loader"></span>
          <span v-else>Проверить статус</span>
        </ChocolateButton>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      Поиск заказа...
    </div>
    
    <div v-if="foundOrder" class="order-info fade-in">
      <ChocolateCard :title="`Заказ #${foundOrder.order_number}`">
        <div class="order-status">
          <ChocolateStatusBadge :status="foundOrder.status" />
        </div>
        
        <div class="order-details">
          <div class="detail-item">
            <span class="detail-label">Клиент:</span>
            <span class="detail-value">{{ foundOrder.user_name || 'Не указан' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Услуга:</span>
            <span class="detail-value">{{ foundOrder.service_name || 'Не указана' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Устройство:</span>
            <span class="detail-value">{{ foundOrder.device_type }} {{ foundOrder.device_model || '' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Описание:</span>
            <span class="detail-value">{{ foundOrder.problem_description }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Дата создания:</span>
            <span class="detail-value">{{ formatDate(foundOrder.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Дата завершения:</span>
            <span class="detail-value">{{ formatDate(foundOrder.completed_at) || 'В работе' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Стоимость:</span>
            <span class="detail-value">{{ foundOrder.price ? Number(foundOrder.price).toFixed(2) + ' ₽' : 'Не указана' }}</span>
          </div>
        </div>
        
        <div v-if="foundOrder.status === 'completed'" class="completed-message">
          <p>✓ Заказ выполнен и готов к выдаче!</p>
        </div>
        <div v-else-if="foundOrder.status === 'in-progress'" class="in-progress-message">
          <p>⏳ Заказ в процессе выполнения</p>
        </div>
        <div v-else-if="foundOrder.status === 'pending'" class="pending-message">
          <p>🕒 Заказ ожидает обработки</p>
        </div>
        <div v-else-if="foundOrder.status === 'cancelled'" class="cancelled-message">
          <p>✕ Заказ отменен</p>
        </div>
      </ChocolateCard>
    </div>
    
    <div v-if="notFound" class="not-found">
      <p>❌ Заказ с номером "{{ searchOrderNumber }}" не найден</p>
      <p class="not-found-hint">Проверьте правильность ввода номера заказа</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOrderStore } from '../stores/orderStore'
import ChocolateInput from './ui/ChocolateInput.vue'
import ChocolateButton from './ui/ChocolateButton.vue'
import ChocolateCard from './ui/ChocolateCard.vue'
import ChocolateStatusBadge from './ui/ChocolateStatusBadge.vue'

const orderStore = useOrderStore()
const searchOrderNumber = ref('')
const foundOrder = ref(null)
const notFound = ref(false)
const searchError = ref('')
const loading = ref(false)

// Функция поиска заказа по номеру
const searchOrder = async () => {
  // Валидация
  if (!searchOrderNumber.value) {
    searchError.value = 'Введите номер заказа'
    return
  }

  // Очищаем предыдущие результаты
  searchError.value = ''
  notFound.value = false
  foundOrder.value = null
  loading.value = true

  try {
    const searchTerm = searchOrderNumber.value.trim()
    console.log('🔍 Поиск заказа:', searchTerm)

    // Используем функцию из store для поиска
    const result = await orderStore.findOrderByNumber(searchTerm)
    console.log('📦 Результат поиска:', result)
    
    if (result) {
      foundOrder.value = result
      console.log('✅ Заказ найден:', foundOrder.value.order_number)
    } else {
      notFound.value = true
      console.log('❌ Заказ не найден')
    }
  } catch (err) {
    console.error('❌ Ошибка при поиске заказа:', err)
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return null
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
.status-page {
  padding: 40px 0;
  max-width: 600px;
  margin: 0 auto;
}

.page-title {
  color: var(--chocolate-700);
  margin-bottom: 30px;
  font-size: 32px;
  text-align: center;
}

.status-form {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(102, 85, 68, 0.08);
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.input-container {
  flex: 1;
}

.input-container :deep(.input-wrapper) {
  margin-bottom: 0;
}

.button-container {
  flex-shrink: 0;
}

.button-container :deep(.chocolate-btn) {
  height: 46px;
  margin: 0;
  white-space: nowrap;
  min-width: 160px;
}

.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--chocolate-50);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.order-info {
  margin-top: 30px;
}

.order-status {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--chocolate-100);
}

.detail-label {
  width: 130px;
  color: var(--chocolate-500);
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: var(--chocolate-800);
}

.completed-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.in-progress-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.pending-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.cancelled-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.loading, .not-found {
  text-align: center;
  padding: 40px;
  color: var(--chocolate-500);
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(102, 85, 68, 0.08);
}

.not-found {
  color: #dc2626;
}

.not-found-hint {
  margin-top: 10px;
  color: var(--chocolate-400);
  font-size: 14px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@media (max-width: 500px) {
  .status-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .button-container :deep(.chocolate-btn) {
    width: 100%;
  }
  
  .detail-item {
    flex-direction: column;
  }
  
  .detail-label {
    width: 100%;
    margin-bottom: 4px;
  }
}
</style>
<template>
  <div class="order-page container">
    <h1 class="page-title">Оформление заказа</h1>
    
    <div class="order-form">
      <ChocolateCard>
        <form @submit.prevent="submitOrder">
          <div class="form-section">
            <h3>Выберите услугу</h3>
            <select 
              v-model="form.service_id" 
              class="chocolate-select" 
              required
              @change="onServiceChange"
            >
              <option value="">Выберите услугу</option>
              <option 
                v-for="service in serviceStore.services" 
                :key="service.id" 
                :value="service.id"
              >
                {{ service.name }} - {{ service.price }} ₽
              </option>
            </select>
            
            <!-- Отображение выбранной услуги и цены -->
            <div v-if="selectedService" class="selected-service-info">
              <div class="info-row">
                <span class="info-label">Выбранная услуга:</span>
                <span class="info-value">{{ selectedService.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Описание:</span>
                <span class="info-value">{{ selectedService.description || 'Нет описания' }}</span>
              </div>
              <div class="info-row price-row">
                <span class="info-label">Цена:</span>
                <span class="info-value price">{{ selectedService.price }} ₽</span>
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h3>Информация о технике</h3>
            
            <ChocolateInput
              id="device_type"
              v-model="form.device_type"
              label="Тип устройства *"
              placeholder="Например: Смартфон, Ноутбук, Планшет"
              required
            />
            
            <ChocolateInput
              id="device_model"
              v-model="form.device_model"
              label="Модель"
              placeholder="Например: iPhone 12, ASUS X515"
            />
            
            <ChocolateInput
              id="problem_description"
              v-model="form.problem_description"
              label="Описание проблемы *"
              placeholder="Опишите проблему подробно"
              required
            />
          </div>
          
          <!-- Итоговая стоимость -->
          <div v-if="selectedService" class="total-section">
            <div class="total-row">
              <span class="total-label">Итого к оплате:</span>
              <span class="total-value">{{ selectedService.price }} ₽</span>
            </div>
          </div>
          
          <div v-if="orderError" class="error-message">
            {{ orderError }}
          </div>
          
          <div class="form-actions">
            <ChocolateButton 
              type="submit" 
              variant="primary"
              :disabled="isSubmitting || !selectedService"
            >
              <span v-if="isSubmitting" class="loader"></span>
              <span v-else>Оформить заказ ({{ selectedService?.price || 0 }} ₽)</span>
            </ChocolateButton>
            <ChocolateButton type="button" variant="outline" @click="cancel" :disabled="isSubmitting">
              Отмена
            </ChocolateButton>
          </div>
        </form>
      </ChocolateCard>
      
      <!-- Модальное окно успеха -->
      <div v-if="showSuccess" class="modal-overlay" @click.self="closeSuccess">
        <div class="modal-content success-modal">
          <div class="success-icon">✓</div>
          <h2>Заказ успешно оформлен!</h2>
          <p class="order-number-label">Номер вашего заказа:</p>
          <p class="order-number-value"><strong>#{{ newOrderNumber }}</strong></p>
          
          <!-- Информация о заказе -->
          <div class="order-summary">
            <div class="summary-row">
              <span>Услуга:</span>
              <span>{{ selectedService?.name }}</span>
            </div>
            <div class="summary-row">
              <span>Устройство:</span>
              <span>{{ form.device_type }} {{ form.device_model }}</span>
            </div>
            <div class="summary-row total">
              <span>Стоимость:</span>
              <span>{{ selectedService?.price }} ₽</span>
            </div>
          </div>
          
          <p class="order-info">Статус заказа можно отслеживать в личном кабинете</p>
          
          <div class="action-buttons">
            <ChocolateButton @click="createAnotherOrder" variant="outline" class="action-btn">
              <span class="btn-icon">➕</span>
              Создать ещё один заказ
            </ChocolateButton>
            
            <ChocolateButton @click="goToProfile" variant="primary" class="action-btn">
              <span class="btn-icon">👤</span>
              Перейти в личный кабинет
            </ChocolateButton>
            
            <ChocolateButton @click="goToHome" variant="outline" class="action-btn">
              <span class="btn-icon">🏠</span>
              На главную
            </ChocolateButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

/**
 * Страница оформления нового заказа.
 * Пользователь выбирает услугу, заполняет данные об устройстве и проблеме.
 * 
 * @component
 * @requires useServiceStore
 * @requires useOrderStore
 */

import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useServiceStore } from '../stores/serviceStore'
import { useOrderStore } from '../stores/orderStore'
import ChocolateCard from './ui/ChocolateCard.vue'
import ChocolateInput from './ui/ChocolateInput.vue'
import ChocolateButton from './ui/ChocolateButton.vue'

const route = useRoute()
const router = useRouter()
const serviceStore = useServiceStore()
const orderStore = useOrderStore()

/**
 * Форма создания заказа.
 * @type {Ref<Object>}
 * @property {string|number} service_id - ID выбранной услуги
 * @property {string} device_type - Тип устройства
 * @property {string} device_model - Модель устройства
 * @property {string} problem_description - Описание проблемы
 */

// Состояния формы
const form = ref({
  service_id: '',
  device_type: '',
  device_model: '',
  problem_description: ''
})

// Состояния загрузки и ошибок
const isSubmitting = ref(false)
const orderError = ref('')

// Состояния успеха
const showSuccess = ref(false)
const newOrderNumber = ref('')

// Счетчик созданных заказов за сессию
const sessionOrdersCount = ref(1)

/**
 * Вычисляемое свойство – выбранная услуга из списка.
 * @type {import('vue').ComputedRef<Object|null>}
 */

// Выбранная услуга
const selectedService = computed(() => {
  if (!form.value.service_id) return null
  return serviceStore.services.find(s => s.id === parseInt(form.value.service_id))
})

// Загружаем услуги при монтировании
onMounted(async () => {
  try {
    await serviceStore.fetchServices()
  } catch (err) {
    console.error('❌ Ошибка загрузки услуг:', err)
    orderError.value = 'Не удалось загрузить список услуг'
  }
  
  // Если перешли с выбранной услугой
  const serviceId = route.query.service
  if (serviceId) {
    form.value.service_id = serviceId
  }
  
  // Инициализируем счетчик сессии
  initializeSessionCounter()
})

// Инициализация счетчика сессии
const initializeSessionCounter = () => {
  const saved = sessionStorage.getItem('sessionOrdersCount')
  if (saved) {
    sessionOrdersCount.value = parseInt(saved)
  } else {
    sessionOrdersCount.value = 1
    sessionStorage.setItem('sessionOrdersCount', '1')
  }
}

// Обновление счетчика сессии
const incrementSessionCounter = () => {
  sessionOrdersCount.value++
  sessionStorage.setItem('sessionOrdersCount', sessionOrdersCount.value.toString())
}

// Обработчик изменения услуги
const onServiceChange = () => {
  // Дополнительная логика при выборе услуги
  console.log('Выбрана услуга:', selectedService.value)
}

// Сброс формы
const resetForm = () => {
  form.value = {
    service_id: '',
    device_type: '',
    device_model: '',
    problem_description: ''
  }
  orderError.value = ''
}

/**
 * Валидирует форму перед отправкой.
 * 
 * @returns {boolean} true если форма валидна, иначе false
 */

// Валидация формы
const validateForm = () => {
  if (!form.value.service_id) {
    orderError.value = 'Выберите услугу'
    return false
  }
  if (!form.value.device_type.trim()) {
    orderError.value = 'Введите тип устройства'
    return false
  }
  if (!form.value.problem_description.trim()) {
    orderError.value = 'Опишите проблему'
    return false
  }
  return true
}

/**
 * Отправляет данные заказа на сервер.
 * При успехе показывает модальное окно с номером заказа.
 * 
 * @async
 * @returns {Promise<void>}
 * @throws {Error} При ошибке создания заказа
 */

// Отправка формы
const submitOrder = async () => {
  // Сбрасываем ошибку
  orderError.value = ''
  
  // Валидация
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const result = await orderStore.createOrder({
      service_id: parseInt(form.value.service_id),
      device_type: form.value.device_type.trim(),
      device_model: form.value.device_model?.trim() || null,
      problem_description: form.value.problem_description.trim()
      // Цена не отправляется, сервер сам её получит из базы
    })

    if (result.success) {
      // Успешное создание заказа
      newOrderNumber.value = result.orderNumber || result.order?.order_number || 'Не указан'
      
      // Обновляем счетчик сессии
      incrementSessionCounter()
      
      // Показываем модальное окно успеха
      showSuccess.value = true
      
    } else {
      // Ошибка от сервера
      orderError.value = result.error || 'Не удалось создать заказ'
    }
  } catch (err) {
    console.error('❌ Непредвиденная ошибка:', err)
    orderError.value = 'Произошла непредвиденная ошибка'
  } finally {
    isSubmitting.value = false
  }
}

// Создать ещё один заказ
const createAnotherOrder = () => {
  resetForm()
  showSuccess.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Перейти в профиль
const goToProfile = () => {
  showSuccess.value = false
  router.push('/profile')
}

// Перейти на главную
const goToHome = () => {
  showSuccess.value = false
  router.push('/')
}

// Отмена и возврат на главную
const cancel = () => {
  router.push('/')
}

// Закрыть модальное окно успеха
const closeSuccess = () => {
  showSuccess.value = false
}
</script>

<style scoped>
.order-page {
  padding: 40px 0;
  max-width: 800px;
  margin: 0 auto;
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
}

.page-title {
  color: var(--chocolate-700);
  margin-bottom: 30px;
  font-size: 32px;
  text-align: center;
}

.order-form {
  width: 100%;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  color: var(--chocolate-700);
  margin-bottom: 20px;
  font-size: 18px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--chocolate-100);
}

.chocolate-select {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--chocolate-200);
  border-radius: 6px;
  font-size: 16px;
  color: var(--chocolate-800);
  transition: all 0.2s ease;
  background-color: white;
  cursor: pointer;
  margin-bottom: 20px;
}

.chocolate-select:focus {
  outline: none;
  border-color: var(--chocolate-600);
  box-shadow: 0 0 0 3px rgba(127, 107, 88, 0.1);
}

.chocolate-select:hover {
  border-color: var(--chocolate-400);
}

/* Информация о выбранной услуге */
.selected-service-info {
  background-color: var(--chocolate-50);
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
  border: 1px solid var(--chocolate-200);
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  padding: 4px 0;
}

.info-label {
  width: 120px;
  color: var(--chocolate-500);
  font-weight: 500;
  font-size: 14px;
}

.info-value {
  flex: 1;
  color: var(--chocolate-700);
  font-size: 14px;
}

.price-row {
  border-top: 1px solid var(--chocolate-200);
  margin-top: 4px;
  padding-top: 8px;
}

.price {
  font-weight: 600;
  color: var(--chocolate-700);
  font-size: 16px;
}

/* Итоговая стоимость */
.total-section {
  background-color: var(--chocolate-100);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-weight: 500;
  color: var(--chocolate-700);
  font-size: 16px;
}

.total-value {
  font-weight: 700;
  color: var(--chocolate-800);
  font-size: 24px;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid var(--chocolate-100);
}

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
  border: 1px solid #fecaca;
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

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.success-modal {
  text-align: center;
}

.success-icon {
  font-size: 64px;
  color: #10b981;
  margin-bottom: 20px;
  animation: scaleIn 0.5s ease;
}

.success-modal h2 {
  color: var(--chocolate-700);
  margin-bottom: 20px;
  font-size: 24px;
}

.order-number-label {
  color: var(--chocolate-500);
  font-size: 14px;
  margin-bottom: 5px;
}

.order-number-value {
  font-size: 32px;
  color: var(--chocolate-700);
  margin-bottom: 20px;
  padding: 10px;
  background-color: var(--chocolate-50);
  border-radius: 8px;
  border: 1px solid var(--chocolate-200);
}

/* Сводка по заказу */
.order-summary {
  background-color: var(--chocolate-50);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: left;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--chocolate-600);
  font-size: 14px;
}

.summary-row.total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--chocolate-200);
  font-weight: 600;
  color: var(--chocolate-700);
  font-size: 16px;
}

.order-info {
  color: var(--chocolate-500);
  font-size: 14px;
  margin-bottom: 30px;
}

/* Кнопки действий */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-icon {
  font-size: 18px;
}

/* Статистика сессии */
.session-stats {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--chocolate-100);
  color: var(--chocolate-500);
  font-size: 14px;
}

.session-stats strong {
  color: var(--chocolate-700);
  font-size: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .order-page {
    padding: 20px;
  }
  
  .page-title {
    font-size: 28px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
  
  .info-row {
    flex-direction: column;
  }
  
  .info-label {
    width: 100%;
    margin-bottom: 4px;
  }
  
  .modal-content {
    padding: 30px 20px;
  }
  
  .order-number-value {
    font-size: 24px;
  }
}
</style>
<template>
  <div class="profile-page container">
    <h1 class="page-title">Личный кабинет</h1>
    
    <div class="profile-grid">
      <!-- Левая колонка - Личная информация -->
      <ChocolateCard title="Личная информация" class="profile-card">
        <div v-if="userStore.loading" class="loading">
          Загрузка...
        </div>
        <div v-else>
          <div class="info-item">
            <span class="info-label">Имя:</span>
            <span class="info-value">{{ userStore.user?.first_name || 'Не указано' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Фамилия:</span>
            <span class="info-value">{{ userStore.user?.last_name || 'Не указано' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">{{ userStore.user?.email || 'Не указано' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Телефон:</span>
            <span class="info-value">{{ userStore.user?.phone || 'Не указан' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Роль:</span>
            <span class="info-value">
              <span :class="getRoleClass">
                {{ getRoleText }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Дата последнего обращения:</span>
            <span class="info-value">
              <span v-if="userStore.user?.last_visit" class="last-visit-date">
                {{ formatDate(userStore.user.last_visit) }}
              </span>
              <span v-else class="last-visit-empty">
                Нет обращений
              </span>
            </span>
          </div>
        </div>
        
        <template #footer>
          <ChocolateButton variant="outline" @click="editProfile">
            Редактировать профиль
          </ChocolateButton>
        </template>
      </ChocolateCard>
      
      <!-- Правая колонка - Обращения -->
      <ChocolateCard title="Мои обращения" class="profile-card">
        <template #header-actions>
          <div class="card-header-actions">
            <ChocolateButton variant="primary" size="small" @click="createOrder">
              + Новое обращение
            </ChocolateButton>
          </div>
        </template>
        
        <!-- Фильтры -->
        <div class="filters-section">
          <div class="filter-tabs">
            <button 
              class="filter-tab" 
              :class="{ 'filter-tab--active': filterStatus === 'all' }"
              @click="filterStatus = 'all'"
            >
              Все ({{ orderStore.userOrders.length }})
            </button>
            <button 
              class="filter-tab" 
              :class="{ 'filter-tab--active': filterStatus === 'pending' }"
              @click="filterStatus = 'pending'"
            >
              Ожидает ({{ getCountByStatus('pending') }})
            </button>
            <button 
              class="filter-tab" 
              :class="{ 'filter-tab--active': filterStatus === 'in-progress' }"
              @click="filterStatus = 'in-progress'"
            >
              В работе ({{ getCountByStatus('in-progress') }})
            </button>
            <button 
              class="filter-tab" 
              :class="{ 'filter-tab--active': filterStatus === 'completed' }"
              @click="filterStatus = 'completed'"
            >
              Выполнено ({{ getCountByStatus('completed') }})
            </button>
            <button 
              class="filter-tab" 
              :class="{ 'filter-tab--active': filterStatus === 'cancelled' }"
              @click="filterStatus = 'cancelled'"
            >
              Отменено ({{ getCountByStatus('cancelled') }})
            </button>
          </div>
          
          <div class="search-section">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Поиск по номеру заказа или устройству..."
              class="search-input"
            >
          </div>
        </div>
        
        <div v-if="orderStore.loading" class="loading">
          Загрузка обращений...
        </div>
        
        <div v-else-if="filteredOrders.length === 0" class="no-orders">
          <p v-if="searchQuery">По вашему запросу ничего не найдено</p>
          <p v-else>У вас пока нет обращений</p>
          <ChocolateButton variant="primary" @click="createOrder">
            Создать обращение
          </ChocolateButton>
        </div>
        
        <div v-else class="orders-list">
          <div 
            v-for="order in paginatedOrders" 
            :key="order.id" 
            class="order-item"
          >
            <div class="order-header">
              <div class="order-title">
                <span class="order-id">Заказ #{{ order.order_number }}</span>
                <ChocolateStatusBadge :status="order.status" />
              </div>
              <div class="order-actions">
                <button 
                  v-if="order.status === 'completed'"
                  class="action-btn pdf" 
                  @click="downloadOrderPDF(order)"
                  title="Скачать заказ-наряд и гарантию"
                >
                  📄 PDF
                </button>
                <button 
                  class="action-btn view" 
                  @click="viewOrderDetails(order)"
                  title="Просмотр деталей"
                >
                  📃
                </button>
              </div>
            </div>
            
            <div class="order-details">
              <div class="order-info-row">
                <span class="info-label">Услуга:</span>
                <span class="info-value">{{ order.service_name || 'Не указана' }}</span>
              </div>
              <div class="order-info-row">
                <span class="info-label">Устройство:</span>
                <span class="info-value">{{ order.device_type }} {{ order.device_model || '' }}</span>
              </div>
              <div class="order-info-row">
                <span class="info-label">Описание:</span>
                <span class="info-value">{{ truncateText(order.problem_description, 100) }}</span>
              </div>
              <div class="order-info-row">
                <span class="info-label">Создан:</span>
                <span class="info-value">{{ formatDateTime(order.created_at) }}</span>
              </div>
              <div v-if="order.completed_at" class="order-info-row">
                <span class="info-label">Завершен:</span>
                <span class="info-value">{{ formatDateTime(order.completed_at) }}</span>
              </div>
              <div class="order-info-row">
                <span class="info-label">Стоимость:</span>
                <span class="info-value price">{{ order.price ? Number(order.price).toFixed(2) + ' ₽' : 'Не указана' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Пагинация -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              class="pagination-btn" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              ←
            </button>
            <span class="pagination-info">
              {{ currentPage }} из {{ totalPages }}
            </span>
            <button 
              class="pagination-btn" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              →
            </button>
          </div>
        </div>
      </ChocolateCard>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ЗАКАЗА ========== -->
    <div v-if="showOrderDetailsModal" class="modal-overlay" @click.self="closeOrderDetailsModal">
      <div class="modal-content order-details-modal">
        <h2>Детали заказа #{{ selectedOrder?.order_number }}</h2>
        
        <div class="order-full-details">
          <div class="detail-section">
            <h3>Информация о заказе</h3>
            <div class="detail-row">
              <span class="detail-label">Статус:</span>
              <span class="detail-value">
                <ChocolateStatusBadge :status="selectedOrder?.status" />
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Дата создания:</span>
              <span class="detail-value">{{ formatDateTime(selectedOrder?.created_at) }}</span>
            </div>
            <div class="detail-row" v-if="selectedOrder?.completed_at">
              <span class="detail-label">Дата завершения:</span>
              <span class="detail-value">{{ formatDateTime(selectedOrder?.completed_at) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Информация об услуге</h3>
            <div class="detail-row">
              <span class="detail-label">Услуга:</span>
              <span class="detail-value">{{ selectedOrder?.service_name || 'Не указана' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Устройство:</span>
              <span class="detail-value">{{ selectedOrder?.device_type }} {{ selectedOrder?.device_model || '' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Описание проблемы:</span>
              <span class="detail-value">{{ selectedOrder?.problem_description }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Финансовая информация</h3>
            <div class="detail-row">
              <span class="detail-label">Стоимость:</span>
              <span class="detail-value price">{{ selectedOrder?.price ? Number(selectedOrder.price).toFixed(2) + ' ₽' : 'Не указана' }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <ChocolateButton 
            v-if="selectedOrder?.status === 'completed'"
            variant="primary" 
            @click="downloadOrderPDF(selectedOrder)"
          >
            📄 Скачать PDF
          </ChocolateButton>
          <ChocolateButton variant="outline" @click="closeOrderDetailsModal">
            Закрыть
          </ChocolateButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useOrderStore } from '../stores/orderStore'
import axios from 'axios'
import ChocolateCard from './ui/ChocolateCard.vue'
import ChocolateButton from './ui/ChocolateButton.vue'
import ChocolateStatusBadge from './ui/ChocolateStatusBadge.vue'

const API_URL = 'http://localhost:3000/api'

const router = useRouter()
const userStore = useUserStore()
const orderStore = useOrderStore()

// Фильтры и поиск
const filterStatus = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Модальное окно деталей
const showOrderDetailsModal = ref(false)
const selectedOrder = ref(null)

// Вычисляем filteredOrders на основе статуса и поиска
const filteredOrders = computed(() => {
  let orders = orderStore.userOrders || []
  
  // Фильтр по статусу
  if (filterStatus.value !== 'all') {
    orders = orders.filter(o => o.status === filterStatus.value)
  }
  
  // Поиск по номеру заказа или устройству
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    orders = orders.filter(o => 
      o.order_number.toLowerCase().includes(query) ||
      o.device_type.toLowerCase().includes(query) ||
      (o.device_model && o.device_model.toLowerCase().includes(query))
    )
  }
  
  return orders
})

// Пагинация
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage)
})

// Подсчет заказов по статусу
const getCountByStatus = (status) => {
  return (orderStore.userOrders || []).filter(o => o.status === status).length
}

// Загружаем заказы при монтировании
onMounted(async () => {
  await orderStore.fetchUserOrders()
})

const formatDate = (date) => {
  if (!date) return null
  
  try {
    // Если дата в формате YYYY-MM-DD
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-')
      return `${day}.${month}.${year}`
    }
    
    // Если дата в формате ISO
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (e) {
    console.error('Ошибка форматирования даты:', e)
    return null
  }
}

const formatDateTime = (date) => {
  if (!date) return null
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    console.error('Ошибка форматирования даты и времени:', e)
    return null
  }
}

const truncateText = (text, length) => {
  if (!text) return ''
  if (typeof text !== 'string') text = String(text)
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getRoleText = computed(() => {
  if (userStore.isAdmin) return 'Администратор'
  if (userStore.isManager) return 'Менеджер'
  return 'Клиент'
})

const getRoleClass = computed(() => {
  if (userStore.isAdmin) return 'role-admin'
  if (userStore.isManager) return 'role-manager'
  return 'role-user'
})

const editProfile = () => {
  // TODO: реализовать редактирование профиля
  alert('Редактирование профиля будет доступно в следующей версии')
}

const createOrder = () => {
  router.push('/order')
}

const viewOrderDetails = (order) => {
  selectedOrder.value = order
  showOrderDetailsModal.value = true
}

const closeOrderDetailsModal = () => {
  showOrderDetailsModal.value = false
  selectedOrder.value = null
}

const downloadOrderPDF = async (order) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${order.id}/pdf`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `order_${order.order_number}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    
  } catch (err) {
    console.error('❌ Ошибка скачивания PDF:', err)
    alert('Ошибка при скачивании PDF')
  }
}
</script>

<style scoped>
.profile-page {
  padding: 40px 0;
}

.page-title {
  color: var(--chocolate-700);
  margin-bottom: 30px;
  font-size: 32px;
  text-align: center;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.profile-card {
  height: fit-content;
}

.card-header-actions {
  display: flex;
  justify-content: flex-end;
}

.info-item {
  display: flex;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--chocolate-100);
}

.info-label {
  width: 180px;
  color: var(--chocolate-500);
  font-weight: 500;
}

.info-value {
  flex: 1;
  color: var(--chocolate-800);
}

.last-visit-date {
  color: var(--chocolate-600);
  font-weight: 500;
}

.last-visit-empty {
  color: var(--chocolate-400);
  font-style: italic;
}

.role-admin {
  background-color: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.role-manager {
  background-color: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.role-user {
  background-color: #d1fae5;
  color: #065f46;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

/* Фильтры */
.filters-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--chocolate-50);
  border-radius: 8px;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.filter-tab {
  padding: 6px 12px;
  background: white;
  border: 1px solid var(--chocolate-200);
  border-radius: 20px;
  color: var(--chocolate-600);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-tab:hover {
  background-color: var(--chocolate-100);
  border-color: var(--chocolate-300);
}

.filter-tab--active {
  background-color: var(--chocolate-600);
  border-color: var(--chocolate-600);
  color: white;
}

.search-section {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--chocolate-200);
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--chocolate-600);
  box-shadow: 0 0 0 3px rgba(127, 107, 88, 0.1);
}

/* Список заказов */
.no-orders {
  text-align: center;
  padding: 40px 20px;
}

.no-orders p {
  color: var(--chocolate-400);
  margin-bottom: 16px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-item {
  padding: 16px;
  border: 1px solid var(--chocolate-100);
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: white;
}

.order-item:hover {
  border-color: var(--chocolate-300);
  box-shadow: 0 2px 8px rgba(102, 85, 68, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--chocolate-100);
}

.order-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-id {
  font-weight: 600;
  color: var(--chocolate-700);
  font-size: 16px;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-info-row {
  display: flex;
  font-size: 14px;
}

.order-info-row .info-label {
  width: 100px;
  color: var(--chocolate-500);
}

.order-info-row .info-value {
  flex: 1;
  color: var(--chocolate-700);
}

.order-info-row .price {
  font-weight: 600;
  color: var(--chocolate-700);
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: var(--chocolate-100);
}

.action-btn.pdf {
  background-color: var(--chocolate-600);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.action-btn.pdf:hover {
  background-color: var(--chocolate-700);
}

.action-btn.view:hover {
  color: var(--chocolate-700);
}

/* Пагинация */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--chocolate-100);
}

.pagination-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid var(--chocolate-200);
  border-radius: 4px;
  color: var(--chocolate-700);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--chocolate-100);
  border-color: var(--chocolate-300);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--chocolate-600);
  font-size: 14px;
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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-content h2 {
  color: var(--chocolate-700);
  margin-bottom: 24px;
  font-size: 24px;
  border-bottom: 2px solid var(--chocolate-100);
  padding-bottom: 12px;
}

.order-details-modal {
  max-width: 500px;
}

.order-full-details {
  margin-bottom: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  color: var(--chocolate-700);
  font-size: 18px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  margin-bottom: 10px;
  padding: 6px 0;
  border-bottom: 1px solid var(--chocolate-50);
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

.detail-value.price {
  font-weight: 600;
  color: var(--chocolate-700);
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 2px solid var(--chocolate-100);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--chocolate-500);
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

@media (max-width: 768px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    flex-direction: column;
  }
  
  .filter-tab {
    width: 100%;
    text-align: center;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .order-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    width: 100%;
    margin-bottom: 4px;
  }
}
</style>
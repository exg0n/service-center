<template>
  <div class="admin-page container">
    <h1 class="page-title">Панель администратора</h1>
    
    <!-- Статистика -->
    <!-- <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total_orders }}</span>
          <span class="stat-label">Всего заказов</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.pending_orders + stats.in_progress_orders }}</span>
          <span class="stat-label">В работе</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.completed_orders }}</span>
          <span class="stat-label">Выполнено</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.archived_orders || 0 }}</span>
          <span class="stat-label">В архиве</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total_revenue }} ₽</span>
          <span class="stat-label">Выручка</span>
        </div>
      </div>
    </div> -->

    <!-- Вкладки -->
    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ 'tab-btn--active': activeTab === 'orders' }"
        @click="activeTab = 'orders'; fetchOrders()"
      >
        Активные заказы
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'tab-btn--active': activeTab === 'archive' }"
        @click="activeTab = 'archive'; fetchArchive()"
      >
        Архив заказов
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'tab-btn--active': activeTab === 'users' }"
        @click="activeTab = 'users'; fetchUsers()"
      >
        Пользователи
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'tab-btn--active': activeTab === 'services' }"
        @click="activeTab = 'services'; fetchServices()"
      >
        Услуги
      </button>
      <button 
        class="tab-btn" 
        :class="{ 'tab-btn--active': activeTab === 'parts' }"
        @click="activeTab = 'parts'; fetchParts()"
      >
        Запчасти
      </button>
    </div>

    <!-- Содержимое вкладок -->
    <div class="tab-content">
      <!-- ========== АКТИВНЫЕ ЗАКАЗЫ ========== -->
      <div v-if="activeTab === 'orders'" class="orders-tab">
        <div class="table-header">
          <h2>Активные заказы</h2>
          <ChocolateButton variant="primary" @click="exportOrders">
            Экспорт в Excel
          </ChocolateButton>
        </div>
        
        <div v-if="orderStore.loading" class="loading">
          Загрузка заказов...
        </div>
        
        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>№ заказа</th>
              <th>Клиент</th>
              <th>Услуга</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Стоимость</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in activeOrders" :key="order.id">
              <td>#{{ order.order_number }}</td>
              <td>{{ order.user_name || 'Не указан' }}</td>
              <td>{{ order.service_name || 'Не указана' }}</td>
              <td>
                <select 
                  v-model="order.status" 
                  @change="updateOrderStatus(order)"
                  :disabled="updatingStatus === order.id"
                >
                  <option value="pending">Ожидает</option>
                  <option value="in-progress">В работе</option>
                  <option value="completed">Выполнен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>{{ order.price }} ₽</td>
              <td>
                <button class="action-btn edit" @click="openEditOrderModal(order)">✏️</button>
                <button class="action-btn delete" @click="confirmDeleteOrder(order)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ========== АРХИВ ЗАКАЗОВ ========== -->
      <div v-if="activeTab === 'archive'" class="archive-tab">
        <div class="table-header">
          <h2>Архив заказов</h2>
        </div>
        
        <div v-if="archiveLoading" class="loading">
          Загрузка архива...
        </div>
        
        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>№ заказа</th>
              <th>Клиент</th>
              <th>Услуга</th>
              <th>Статус</th>
              <th>Устройство</th>
              <th>Стоимость</th>
              <th>Дата создания</th>
              <th>Дата завершения</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in archiveOrders" :key="order.id">
              <td>#{{ order.order_number }}</td>
              <td>{{ order.user_name || 'Не указан' }}</td>
              <td>{{ order.service_name || 'Не указана' }}</td>
              <td>
                <span :class="getStatusClass(order.status)">
                  {{ getStatusText(order.status) }}
                </span>
              </td>
              <td>{{ order.device_type }} {{ order.device_model || '' }}</td>
              <td>{{ order.price }} ₽</td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>{{ formatDate(order.completed_at) || '—' }}</td>
              <td>
                <button 
                  v-if="order.status === 'cancelled'"
                  class="action-btn restore" 
                  @click="confirmRestoreOrder(order)"
                  :disabled="restoringId === order.id"
                >
                  <span v-if="restoringId === order.id" class="loader-small"></span>
                  <span v-else>↩️ Восстановить</span>
                </button>
                <button 
                  v-if="order.status === 'completed'"
                  class="action-btn pdf" 
                  @click="downloadOrderPDF(order)"
                  title="Скачать заказ-наряд и гарантию"
                >
                  📄 PDF
                </button>
                <button class="action-btn edit" @click="openEditOrderModal(order)">✏️</button>
                <button class="action-btn delete" @click="confirmDeleteOrder(order)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ========== ПОЛЬЗОВАТЕЛИ ========== -->
      <div v-if="activeTab === 'users'" class="users-tab">
        <div class="table-header">
          <h2>Управление пользователями</h2>
          <ChocolateButton variant="primary" @click="openAddUserModal">
            + Добавить пользователя
          </ChocolateButton>
        </div>
        
        <div v-if="userLoading" class="loading">
          Загрузка пользователей...
        </div>
        
        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Телефон</th>
              <th>Последний визит</th>
              <th>Заказы</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.first_name }}</td>
              <td>{{ user.last_name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select 
                  v-model="user.role" 
                  @change="updateUserRole(user)"
                  :disabled="user.id === currentUserId"
                >
                  <option :value="0">Администратор</option>
                  <option :value="1">Менеджер</option>
                  <option :value="2">Пользователь</option>
                </select>
              </td>
              <td>{{ user.phone || '—' }}</td>
              <td>{{ formatDate(user.last_visit) || 'Нет' }}</td>
              <td>{{ user.total_orders || 0 }}</td>
              <td>
                <button class="action-btn edit" @click="openEditUserModal(user)" :disabled="user.id === currentUserId">✏️</button>
                <button class="action-btn delete" @click="confirmDeleteUser(user)" :disabled="user.id === currentUserId">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ========== УСЛУГИ ========== -->
      <div v-if="activeTab === 'services'" class="services-tab">
        <div class="table-header">
          <h2>Управление услугами</h2>
          <ChocolateButton variant="primary" @click="openAddServiceModal">
            + Добавить услугу
          </ChocolateButton>
        </div>
        
        <div v-if="serviceStore.loading" class="loading">
          Загрузка услуг...
        </div>
        
        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Описание</th>
              <th>Цена</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in serviceStore.services" :key="service.id">
              <td>{{ service.id }}</td>
              <td>{{ service.name }}</td>
              <td>{{ service.description || '—' }}</td>
              <td>{{ service.price }} ₽</td>
              <td>
                <button class="action-btn edit" @click="openEditServiceModal(service)">✏️</button>
                <button class="action-btn delete" @click="confirmDeleteService(service)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ========== ЗАПЧАСТИ (обновлено) ========== -->
      <div v-if="activeTab === 'parts'" class="parts-tab">
        <div class="table-header">
          <h2>Склад запчастей</h2>
          <ChocolateButton variant="primary" @click="openAddPartModal">
            + Добавить запчасть
          </ChocolateButton>
        </div>
        
        <div v-if="partStore.loading" class="loading">
          Загрузка запчастей...
        </div>
        
        <table v-else class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Описание</th>
              <th>Количество</th>
              <th>Цена</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="part in partStore.parts" :key="part.id">
              <td>{{ part.id }}</td>
              <td>{{ part.name }}</td>
              <td>{{ part.description || '—' }}</td>
              <td>
                <div class="quantity-wrapper">
                  <input 
                    v-model.number="part.quantity" 
                    type="number" 
                    min="0"
                    @change="updatePartQuantity(part)"
                    class="quantity-input"
                    :disabled="updatingPartId === part.id"
                  />
                  <span v-if="updatingPartId === part.id" class="loader-small"></span>
                  <span v-else-if="updateSuccessId === part.id" class="success-check">✓</span>
                </div>
              </td>
              <td>{{ part.price }} ₽</td>
              <td>
                <span :class="{'low-stock': part.quantity < 5}">
                  {{ part.quantity < 5 ? 'Мало' : 'Достаточно' }}
                </span>
              </td>
              <td>
                <button class="action-btn edit" @click="openEditPartModal(part)">✏️</button>
                <button class="action-btn delete" @click="confirmDeletePart(part)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ ЗАКАЗА ========== -->
    <div v-if="showEditOrderModal" class="modal-overlay" @click.self="closeEditOrderModal">
      <div class="modal-content edit-order-modal">
        <h2>Редактирование заказа #{{ editOrderForm?.order_number }}</h2>
        
        <form @submit.prevent="saveOrder">
          <div class="form-row">
            <div class="form-group">
              <label>Клиент</label>
              <select v-model="editOrderForm.user_id" class="modal-input" required>
                <option value="">Выберите клиента</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.first_name }} {{ user.last_name }} ({{ user.email }})
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Услуга</label>
              <select v-model="editOrderForm.service_id" class="modal-input" required>
                <option value="">Выберите услугу</option>
                <option v-for="service in serviceStore.services" :key="service.id" :value="service.id">
                  {{ service.name }} - {{ service.price }} ₽
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Тип устройства *</label>
              <input v-model="editOrderForm.device_type" type="text" required class="modal-input">
            </div>
            
            <div class="form-group">
              <label>Модель</label>
              <input v-model="editOrderForm.device_model" type="text" class="modal-input">
            </div>
          </div>

          <div class="form-group">
            <label>Описание проблемы *</label>
            <textarea v-model="editOrderForm.problem_description" rows="3" required class="modal-input"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Статус</label>
              <select v-model="editOrderForm.status" class="modal-input">
                <option value="pending">Ожидает</option>
                <option value="in-progress">В работе</option>
                <option value="completed">Выполнен</option>
                <option value="cancelled">Отменен</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Стоимость (₽)</label>
              <input v-model.number="editOrderForm.price" type="number" min="0" class="modal-input">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Дата создания</label>
              <input v-model="editOrderForm.created_at" type="date" class="modal-input" disabled>
            </div>
            
            <div class="form-group">
              <label>Дата завершения</label>
              <input v-model="editOrderForm.completed_at" type="date" class="modal-input" disabled>
            </div>
          </div>

          <!-- Сообщение об успехе -->
          <div v-if="orderSuccess" class="success-message">
            {{ orderSuccess }}
          </div>
          
          <!-- Сообщение об ошибке -->
          <div v-if="orderError" class="error-message">
            {{ orderError }}
          </div>

          <div class="modal-actions">
            <ChocolateButton type="submit" variant="primary" :disabled="orderSaving">
              {{ orderSaving ? 'Сохранение...' : 'Сохранить изменения' }}
            </ChocolateButton>
            <ChocolateButton type="button" variant="outline" @click="closeEditOrderModal" :disabled="orderSaving">
              Отмена
            </ChocolateButton>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ДЛЯ УПРАВЛЕНИЯ УСЛУГАМИ ========== -->
    <div v-if="showServiceModal" class="modal-overlay" @click.self="closeServiceModal">
      <div class="modal-content service-modal">
        <h2>{{ serviceModalTitle }}</h2>
        
        <form @submit.prevent="saveService">
          <div class="form-group">
            <label>Название услуги *</label>
            <input 
              v-model="serviceForm.name" 
              type="text" 
              required 
              class="modal-input"
              placeholder="Например: Ремонт телефонов"
            >
          </div>
          
          <div class="form-group">
            <label>Описание</label>
            <textarea 
              v-model="serviceForm.description" 
              rows="3" 
              class="modal-input"
              placeholder="Подробное описание услуги"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Цена (₽) *</label>
            <input 
              v-model.number="serviceForm.price" 
              type="number" 
              min="0" 
              step="0.01"
              required 
              class="modal-input"
              placeholder="0.00"
            >
          </div>
          
          <!-- Сообщение об успехе -->
          <div v-if="serviceSuccess" class="success-message">
            {{ serviceSuccess }}
          </div>
          
          <!-- Сообщение об ошибке -->
          <div v-if="serviceError" class="error-message">
            {{ serviceError }}
          </div>
          
          <div class="modal-actions">
            <ChocolateButton type="submit" variant="primary" :disabled="serviceSaving">
              {{ serviceSaving ? 'Сохранение...' : serviceModalButtonText }}
            </ChocolateButton>
            <ChocolateButton type="button" variant="outline" @click="closeServiceModal" :disabled="serviceSaving">
              Отмена
            </ChocolateButton>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ УСЛУГИ ========== -->
    <div v-if="showDeleteServiceModal" class="modal-overlay" @click.self="closeDeleteServiceModal">
      <div class="modal-content delete-modal">
        <div class="delete-icon">🗑️</div>
        <h2>Удаление услуги</h2>
        <p>Вы уверены, что хотите удалить услугу "{{ serviceToDelete?.name }}"?</p>
        
        <div class="delete-details" v-if="serviceToDelete">
          <div><strong>ID:</strong> {{ serviceToDelete.id }}</div>
          <div><strong>Цена:</strong> {{ serviceToDelete.price }} ₽</div>
          <div v-if="serviceToDelete.description"><strong>Описание:</strong> {{ serviceToDelete.description }}</div>
        </div>
        
        <!-- Сообщение об успехе -->
        <div v-if="deleteServiceSuccess" class="success-message">
          {{ deleteServiceSuccess }}
        </div>
        
        <!-- Сообщение об ошибке -->
        <div v-if="deleteServiceError" class="error-message">
          {{ deleteServiceError }}
        </div>
        
        <div class="modal-actions" v-if="!deleteServiceSuccess">
          <ChocolateButton 
            @click="confirmDeleteServiceAction" 
            variant="primary" 
            :disabled="deleteServiceLoading"
          >
            {{ deleteServiceLoading ? 'Удаление...' : 'Удалить' }}
          </ChocolateButton>
          <ChocolateButton 
            type="button" 
            variant="outline" 
            @click="closeDeleteServiceModal"
            :disabled="deleteServiceLoading"
          >
            Отмена
          </ChocolateButton>
        </div>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ДЛЯ УПРАВЛЕНИЯ ЗАПЧАСТЯМИ ========== -->
    <div v-if="showPartModal" class="modal-overlay" @click.self="closePartModal">
      <div class="modal-content part-modal">
        <h2>{{ partModalTitle }}</h2>
        
        <form @submit.prevent="savePart">
          <div class="form-group">
            <label>Название запчасти *</label>
            <input 
              v-model="partForm.name" 
              type="text" 
              required 
              class="modal-input"
              placeholder="Например: Экран iPhone 12"
            >
          </div>
          
          <div class="form-group">
            <label>Описание</label>
            <textarea 
              v-model="partForm.description" 
              rows="3" 
              class="modal-input"
              placeholder="Подробное описание запчасти"
            ></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Количество *</label>
              <input 
                v-model.number="partForm.quantity" 
                type="number" 
                min="0" 
                required 
                class="modal-input"
                placeholder="0"
              >
            </div>
            
            <div class="form-group">
              <label>Цена (₽) *</label>
              <input 
                v-model.number="partForm.price" 
                type="number" 
                min="0" 
                step="0.01"
                required 
                class="modal-input"
                placeholder="0.00"
              >
            </div>
          </div>
          
          <!-- Сообщение об успехе -->
          <div v-if="partSuccess" class="success-message">
            {{ partSuccess }}
          </div>
          
          <!-- Сообщение об ошибке -->
          <div v-if="partError" class="error-message">
            {{ partError }}
          </div>
          
          <div class="modal-actions">
            <ChocolateButton type="submit" variant="primary" :disabled="partSaving">
              {{ partSaving ? 'Сохранение...' : partModalButtonText }}
            </ChocolateButton>
            <ChocolateButton type="button" variant="outline" @click="closePartModal" :disabled="partSaving">
              Отмена
            </ChocolateButton>
          </div>
        </form>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ЗАПЧАСТИ ========== -->
    <div v-if="showDeletePartModal" class="modal-overlay" @click.self="closeDeletePartModal">
      <div class="modal-content delete-modal">
        <div class="delete-icon">🗑️</div>
        <h2>Удаление запчасти</h2>
        <p>Вы уверены, что хотите удалить запчасть "{{ partToDelete?.name }}"?</p>
        
        <div class="delete-details" v-if="partToDelete">
          <div><strong>ID:</strong> {{ partToDelete.id }}</div>
          <div><strong>Количество:</strong> {{ partToDelete.quantity }} шт.</div>
          <div><strong>Цена:</strong> {{ partToDelete.price }} ₽</div>
          <div v-if="partToDelete.description"><strong>Описание:</strong> {{ partToDelete.description }}</div>
        </div>
        
        <!-- Сообщение об успехе -->
        <div v-if="deletePartSuccess" class="success-message">
          {{ deletePartSuccess }}
        </div>
        
        <!-- Сообщение об ошибке -->
        <div v-if="deletePartError" class="error-message">
          {{ deletePartError }}
        </div>
        
        <div class="modal-actions" v-if="!deletePartSuccess">
          <ChocolateButton 
            @click="confirmDeletePartAction" 
            variant="primary" 
            :disabled="deletePartLoading"
          >
            {{ deletePartLoading ? 'Удаление...' : 'Удалить' }}
          </ChocolateButton>
          <ChocolateButton 
            type="button" 
            variant="outline" 
            @click="closeDeletePartModal"
            :disabled="deletePartLoading"
          >
            Отмена
          </ChocolateButton>
        </div>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ДЛЯ РЕДАКТИРОВАНИЯ ПОЛЬЗОВАТЕЛЯ ========== -->
    <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-content">
        <h2>{{ userModalTitle }}</h2>
        
        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label>Имя *</label>
            <input v-model="userForm.first_name" type="text" required class="modal-input">
          </div>
          
          <div class="form-group">
            <label>Фамилия *</label>
            <input v-model="userForm.last_name" type="text" required class="modal-input">
          </div>
          
          <div class="form-group">
            <label>Email *</label>
            <input v-model="userForm.email" type="email" required class="modal-input" :disabled="!!editingUser">
          </div>
          
          <div v-if="!editingUser" class="form-group">
            <label>Пароль *</label>
            <input v-model="userForm.password" type="password" required class="modal-input">
          </div>
          
          <div class="form-group">
            <label>Телефон</label>
            <input v-model="userForm.phone" type="tel" placeholder="+7 (999) 123-45-67" class="modal-input">
          </div>
          
          <div class="form-group">
            <label>Роль</label>
            <select v-model="userForm.role" class="modal-input">
              <option :value="0">Администратор</option>
              <option :value="1">Менеджер</option>
              <option :value="2">Пользователь</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <ChocolateButton type="submit" variant="primary" :disabled="userSaving">
              {{ userSaving ? 'Сохранение...' : 'Сохранить' }}
            </ChocolateButton>
            <ChocolateButton type="button" variant="outline" @click="closeUserModal">
              Отмена
            </ChocolateButton>
          </div>
          
          <div v-if="userError" class="error-message">
            {{ userError }}
          </div>
        </form>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ ВОССТАНОВЛЕНИЯ ========== -->
    <div v-if="showRestoreModal" class="modal-overlay" @click.self="closeRestoreModal">
      <div class="modal-content restore-modal">
        <div class="restore-icon">↩️</div>
        <h2>Восстановление заказа</h2>
        <p>Вы уверены, что хотите восстановить заказ #{{ orderToRestore?.order_number }}?</p>
        <p class="restore-info">Заказ будет перемещен в активные и получит статус "Ожидает"</p>
        
        <div class="order-details-preview">
          <div><strong>Клиент:</strong> {{ orderToRestore?.user_name }}</div>
          <div><strong>Услуга:</strong> {{ orderToRestore?.service_name }}</div>
          <div><strong>Устройство:</strong> {{ orderToRestore?.device_type }} {{ orderToRestore?.device_model }}</div>
        </div>
        
        <div class="modal-actions">
          <ChocolateButton 
            @click="restoreOrder" 
            variant="primary" 
            :disabled="restoring"
          >
            {{ restoring ? 'Восстановление...' : 'Восстановить' }}
          </ChocolateButton>
          <ChocolateButton 
            type="button" 
            variant="outline" 
            @click="closeRestoreModal"
            :disabled="restoring"
          >
            Отмена
          </ChocolateButton>
        </div>
        
        <div v-if="restoreError" class="error-message">
          {{ restoreError }}
        </div>
      </div>
    </div>

    <!-- ========== МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ ========== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-content delete-modal">
        <div class="delete-icon">🗑️</div>
        <h2>{{ deleteModalTitle }}</h2>
        <p>{{ deleteModalMessage }}</p>
        
        <div class="delete-details" v-if="deleteItemDetails">
          {{ deleteItemDetails }}
        </div>
        
        <!-- Сообщение об успехе -->
        <div v-if="deleteSuccess" class="success-message">
          {{ deleteSuccess }}
        </div>
        
        <!-- Сообщение об ошибке -->
        <div v-if="deleteError" class="error-message">
          {{ deleteError }}
        </div>
        
        <div class="modal-actions" v-if="!deleteSuccess">
          <ChocolateButton 
            @click="confirmDelete" 
            variant="primary" 
            :disabled="deleteLoading"
          >
            {{ deleteLoading ? 'Удаление...' : 'Удалить' }}
          </ChocolateButton>
          <ChocolateButton 
            type="button" 
            variant="outline" 
            @click="closeDeleteModal"
            :disabled="deleteLoading"
          >
            Отмена
          </ChocolateButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

/**
 * Компонент панели администратора.
 * Управляет пользователями, услугами, запчастями и заказами.
 *
 * @component
 * @requires useUserStore
 * @requires useOrderStore
 * @requires useServiceStore
 * @requires usePartStore
 */

import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useOrderStore } from '../stores/orderStore'
import { useServiceStore } from '../stores/serviceStore'
import { usePartStore } from '../stores/partStore'
import axios from 'axios'
import ChocolateButton from './ui/ChocolateButton.vue'

const API_URL = 'http://localhost:3000/api'

const router = useRouter()
const userStore = useUserStore()
const orderStore = useOrderStore()
const serviceStore = useServiceStore()
const partStore = usePartStore()

/**
 * Активная вкладка панели администратора.
 * @type {Ref<string>}
 */

const activeTab = ref('orders')
const stats = ref(null)
const updatingStatus = ref(null)
const restoringId = ref(null)

// Данные для архива
const archiveOrders = ref([])
const archiveLoading = ref(false)

// Данные для пользователей

/**
 * Список всех пользователей из БД.
 * @type {Ref<Array<Object>>}
 */

const users = ref([])
const userLoading = ref(false)
const showUserModal = ref(false)
const editingUser = ref(null)
const userForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  role: 2
})
const userSaving = ref(false)
const userError = ref('')

// Данные для модального окна восстановления
const showRestoreModal = ref(false)
const orderToRestore = ref(null)
const restoring = ref(false)
const restoreError = ref('')

// Данные для модального окна удаления
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const deleteError = ref('')
const deleteSuccess = ref('')
const deleteAction = ref(null)
const deleteItem = ref(null)
const deleteItemType = ref('')
const deleteModalTitle = ref('')
const deleteModalMessage = ref('')
const deleteItemDetails = ref('')

// Данные для управления запчастями
const updatingPartId = ref(null)
const updateSuccessId = ref(null)

// Данные для редактирования заказа
const showEditOrderModal = ref(false)
const editingOrder = ref(null)
const editOrderForm = ref({
  id: null,
  order_number: '',
  user_id: '',
  service_id: '',
  device_type: '',
  device_model: '',
  problem_description: '',
  status: '',
  price: null,
  created_at: '',
  completed_at: ''
})
const orderSaving = ref(false)
const orderError = ref('')
const orderSuccess = ref('')

// Данные для управления услугами
const showServiceModal = ref(false)
const editingService = ref(null)
const serviceForm = ref({
  id: null,
  name: '',
  description: '',
  price: null
})
const serviceSaving = ref(false)
const serviceError = ref('')
const serviceSuccess = ref('')

// Данные для удаления услуги
const showDeleteServiceModal = ref(false)
const serviceToDelete = ref(null)
const deleteServiceLoading = ref(false)
const deleteServiceError = ref('')
const deleteServiceSuccess = ref('')

// Данные для управления запчастями (новые)
const showPartModal = ref(false)
const editingPart = ref(null)
const partForm = ref({
  id: null,
  name: '',
  description: '',
  quantity: 0,
  price: null
})
const partSaving = ref(false)
const partError = ref('')
const partSuccess = ref('')

// Данные для удаления запчасти
const showDeletePartModal = ref(false)
const partToDelete = ref(null)
const deletePartLoading = ref(false)
const deletePartError = ref('')
const deletePartSuccess = ref('')

// Текущий пользователь
const currentUserId = computed(() => userStore.user?.id)

// Активные заказы
const activeOrders = computed(() => {
  return orderStore.orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled')
})

const userModalTitle = computed(() => {
  return editingUser.value ? 'Редактирование пользователя' : 'Добавление пользователя'
})

const serviceModalTitle = computed(() => {
  return editingService.value ? 'Редактирование услуги' : 'Добавление услуги'
})

const serviceModalButtonText = computed(() => {
  return editingService.value ? 'Сохранить изменения' : 'Добавить услугу'
})

const partModalTitle = computed(() => {
  return editingPart.value ? 'Редактирование запчасти' : 'Добавление запчасти'
})

const partModalButtonText = computed(() => {
  return editingPart.value ? 'Сохранить изменения' : 'Добавить запчасть'
})

// Проверка прав доступа
onMounted(async () => {
  if (!userStore.isAdmin && !userStore.isManager) {
    router.push('/')
    return
  }
  
  const tokenValid = await checkToken()
  if (!tokenValid) return
  
  await fetchOrders()
  await fetchArchive()
  await fetchUsers()
  await fetchServices()
  await fetchParts()
  await fetchStats()
})

const checkToken = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login')
    return false
  }
  
  try {
    await axios.get(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return true
  } catch (err) {
    console.error('❌ Токен невалиден:', err)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
    return false
  }
}

const fetchOrders = async () => {
  await orderStore.fetchAllOrders()
}

const fetchArchive = async () => {
  archiveLoading.value = true
  try {
    const response = await axios.get(`${API_URL}/orders/archive`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    archiveOrders.value = response.data
  } catch (err) {
    console.error('❌ Ошибка загрузки архива:', err)
  } finally {
    archiveLoading.value = false
  }
}

const fetchUsers = async () => {
  userLoading.value = true
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    users.value = response.data
  } catch (err) {
    console.error('❌ Ошибка загрузки пользователей:', err)
  } finally {
    userLoading.value = false
  }
}

const fetchServices = async () => {
  await serviceStore.fetchServices()
}

const fetchParts = async () => {
  await partStore.fetchParts()
}

const fetchStats = async () => {
  if (orderStore.orders.length > 0) {
    const orders = orderStore.orders
    stats.value = {
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length,
      in_progress_orders: orders.filter(o => o.status === 'in-progress').length,
      completed_orders: orders.filter(o => o.status === 'completed').length,
      cancelled_orders: orders.filter(o => o.status === 'cancelled').length,
      archived_orders: archiveOrders.value.length,
      total_revenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0)
    }
  }
}

const formatDate = (date) => {
  if (!date) return null
  return new Date(date).toLocaleDateString('ru-RU')
}

const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStatusClass = (status) => {
  switch(status) {
    case 'completed': return 'status-badge completed'
    case 'cancelled': return 'status-badge cancelled'
    case 'pending': return 'status-badge pending'
    case 'in-progress': return 'status-badge in-progress'
    default: return 'status-badge'
  }
}

const getStatusText = (status) => {
  switch(status) {
    case 'completed': return 'Выполнен'
    case 'cancelled': return 'Отменен'
    case 'pending': return 'Ожидает'
    case 'in-progress': return 'В работе'
    default: return status
  }
}

// ========== УПРАВЛЕНИЕ ЗАКАЗАМИ ==========
const updateOrderStatus = async (order) => {
  updatingStatus.value = order.id
  try {
    const response = await axios.put(
      `${API_URL}/orders/${order.id}/status`,
      { status: order.status },
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
    
    if (order.status === 'completed' || order.status === 'cancelled') {
      await fetchArchive()
    }
    
    await orderStore.fetchAllOrders()
    await fetchStats()
    
  } catch (err) {
    console.error('❌ Ошибка обновления статуса:', err)
    alert(err.response?.data?.error || 'Ошибка при обновлении статуса')
    await orderStore.fetchAllOrders()
  } finally {
    updatingStatus.value = null
  }
}

/**
 * Открывает модальное окно редактирования заказа.
 * 
 * @param {Object} order - Заказ для редактирования
 * @param {number} order.id - ID заказа
 * @param {string} order.order_number - Номер заказа
 * @param {number} order.user_id - ID пользователя
 * @param {number} order.service_id - ID услуги
 * @param {string} order.device_type - Тип устройства
 * @param {string|null} order.device_model - Модель устройства
 * @param {string} order.problem_description - Описание проблемы
 * @param {string} order.status - Статус заказа
 * @param {number|null} order.price - Стоимость
 * 
 * @example
 * openEditOrderModal({ id: 5, order_number: 'ORD-2026-0005', status: 'pending' })
 */

const openEditOrderModal = (order) => {
  editingOrder.value = order
  editOrderForm.value = {
    id: order.id,
    order_number: order.order_number,
    user_id: order.user_id || '',
    service_id: order.service_id || '',
    device_type: order.device_type || '',
    device_model: order.device_model || '',
    problem_description: order.problem_description || '',
    status: order.status || 'pending',
    price: order.price || null,
    created_at: formatDateForInput(order.created_at),
    completed_at: formatDateForInput(order.completed_at)
  }
  orderError.value = ''
  orderSuccess.value = ''
  showEditOrderModal.value = true
}

const closeEditOrderModal = () => {
  showEditOrderModal.value = false
  editingOrder.value = null
  orderError.value = ''
  orderSuccess.value = ''
}

/**
 * Сохраняет изменения заказа после редактирования.
 * Отправляет PUT-запрос на сервер и обновляет локальные данные.
 * 
 * @async
 * @returns {Promise<void>}
 * @throws {Error} При ошибке сохранения (отображается в модальном окне)
 */

const saveOrder = async () => {
  if (!editOrderForm.value.user_id || !editOrderForm.value.service_id || !editOrderForm.value.device_type || !editOrderForm.value.problem_description) {
    orderError.value = 'Заполните все обязательные поля'
    return
  }

  orderSaving.value = true
  orderError.value = ''
  orderSuccess.value = ''

  try {
    const token = localStorage.getItem('token')
    
    const response = await axios.put(
      `${API_URL}/orders/${editOrderForm.value.id}`,
      {
        user_id: parseInt(editOrderForm.value.user_id),
        service_id: parseInt(editOrderForm.value.service_id),
        device_type: editOrderForm.value.device_type,
        device_model: editOrderForm.value.device_model || null,
        problem_description: editOrderForm.value.problem_description,
        status: editOrderForm.value.status,
        price: editOrderForm.value.price ? parseFloat(editOrderForm.value.price) : null
      },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    )

    console.log('✅ Ответ от сервера:', response.data)

    await orderStore.fetchAllOrders()
    await fetchArchive()
    await fetchStats()
    
    orderSuccess.value = 'Заказ успешно обновлен'
    
    setTimeout(() => {
      closeEditOrderModal()
    }, 1500)
    
  } catch (err) {
    console.error('❌ Ошибка сохранения заказа:', err)
    if (err.response) {
      console.error('Статус ошибки:', err.response.status)
      console.error('Данные ошибки:', err.response.data)
      orderError.value = err.response.data?.error || 'Ошибка при сохранении заказа'
    } else {
      orderError.value = 'Ошибка соединения с сервером'
    }
  } finally {
    orderSaving.value = false
  }
}

const confirmRestoreOrder = (order) => {
  orderToRestore.value = order
  showRestoreModal.value = true
  restoreError.value = ''
}

const closeRestoreModal = () => {
  showRestoreModal.value = false
  orderToRestore.value = null
  restoring.value = false
  restoreError.value = ''
}

const restoreOrder = async () => {
  if (!orderToRestore.value) return
  
  restoring.value = true
  restoreError.value = ''
  restoringId.value = orderToRestore.value.id
  
  try {
    const response = await axios.put(
      `${API_URL}/orders/${orderToRestore.value.id}/restore`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
    
    await orderStore.fetchAllOrders()
    await fetchArchive()
    await fetchStats()
    closeRestoreModal()
    
  } catch (err) {
    console.error('❌ Ошибка восстановления заказа:', err)
    restoreError.value = err.response?.data?.error || 'Ошибка при восстановлении заказа'
  } finally {
    restoring.value = false
    restoringId.value = null
  }
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

/**
 * Экспортирует список заказов в Excel.
 * @todo Реализовать в следующей версии
 */

const exportOrders = () => {
  alert('Экспорт в Excel будет доступен в следующей версии')
}

/**
 * Подтверждает удаление заказа (открывает модальное окно).
 * 
 * @param {Object} order - Заказ для удаления
 * @param {string} order.order_number - Номер заказа для отображения
 */

const confirmDeleteOrder = (order) => {
  deleteItemType.value = 'order'
  deleteItem.value = order
  deleteModalTitle.value = 'Удаление заказа'
  deleteModalMessage.value = `Вы уверены, что хотите удалить заказ #${order.order_number}?`
  deleteItemDetails.value = `Клиент: ${order.user_name || 'Не указан'}\nУслуга: ${order.service_name || 'Не указана'}`
  deleteAction.value = deleteOrder
  deleteSuccess.value = ''
  showDeleteModal.value = true
}

const deleteOrder = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_URL}/orders/${deleteItem.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    await orderStore.fetchAllOrders()
    await fetchArchive()
    await fetchStats()
    
    deleteSuccess.value = 'Заказ успешно удален'
    
    setTimeout(() => {
      closeDeleteModal()
    }, 1500)
    
  } catch (err) {
    console.error('❌ Ошибка удаления заказа:', err)
    throw new Error(err.response?.data?.error || 'Ошибка при удалении заказа')
  }
}

// ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========
const openAddUserModal = () => {
  editingUser.value = null
  userForm.value = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: 2
  }
  userError.value = ''
  showUserModal.value = true
}

const openEditUserModal = (user) => {
  if (user.id === currentUserId.value) {
    showDeleteModal.value = true
    deleteModalTitle.value = 'Ошибка'
    deleteModalMessage.value = 'Вы не можете редактировать свой аккаунт'
    deleteItemDetails.value = ''
    deleteAction.value = null
    return
  }
  
  editingUser.value = user
  userForm.value = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    password: '',
    phone: user.phone || '',
    role: user.role
  }
  userError.value = ''
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  editingUser.value = null
}

const saveUser = async () => {
  userSaving.value = true
  userError.value = ''
  
  try {
    const token = localStorage.getItem('token')
    
    if (editingUser.value) {
      await axios.put(`${API_URL}/admin/users/${editingUser.value.id}`, {
        first_name: userForm.value.first_name,
        last_name: userForm.value.last_name,
        phone: userForm.value.phone,
        role: userForm.value.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } else {
      await axios.post(`${API_URL}/admin/users`, {
        first_name: userForm.value.first_name,
        last_name: userForm.value.last_name,
        email: userForm.value.email,
        password: userForm.value.password,
        phone: userForm.value.phone,
        role: userForm.value.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
    
    await fetchUsers()
    closeUserModal()
  } catch (err) {
    console.error('❌ Ошибка сохранения пользователя:', err)
    userError.value = err.response?.data?.error || 'Ошибка при сохранении пользователя'
  } finally {
    userSaving.value = false
  }
}

const updateUserRole = async (user) => {
  if (user.id === currentUserId.value) {
    showDeleteModal.value = true
    deleteModalTitle.value = 'Ошибка'
    deleteModalMessage.value = 'Вы не можете изменить свою роль'
    deleteItemDetails.value = ''
    deleteAction.value = null
    await fetchUsers()
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    await axios.put(`${API_URL}/admin/users/${user.id}/role`, {
      role: user.role
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (err) {
    console.error('❌ Ошибка обновления роли:', err)
    await fetchUsers()
  }
}

const confirmDeleteUser = (user) => {
  if (user.id === currentUserId.value) {
    showDeleteModal.value = true
    deleteModalTitle.value = 'Ошибка'
    deleteModalMessage.value = 'Вы не можете удалить свой аккаунт'
    deleteItemDetails.value = ''
    deleteAction.value = null
    return
  }
  
  deleteItemType.value = 'user'
  deleteItem.value = user
  deleteModalTitle.value = 'Удаление пользователя'
  deleteModalMessage.value = `Вы уверены, что хотите удалить пользователя?`
  deleteItemDetails.value = `${user.first_name} ${user.last_name}\nEmail: ${user.email}`
  deleteAction.value = deleteUser
  showDeleteModal.value = true
}

const deleteUser = async () => {
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_URL}/admin/users/${deleteItem.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchUsers()
    closeDeleteModal()
  } catch (err) {
    console.error('❌ Ошибка удаления пользователя:', err)
    throw new Error(err.response?.data?.error || 'Ошибка при удалении пользователя')
  }
}

// ========== УПРАВЛЕНИЕ УСЛУГАМИ ==========
const openAddServiceModal = () => {
  editingService.value = null
  serviceForm.value = {
    id: null,
    name: '',
    description: '',
    price: null
  }
  serviceError.value = ''
  serviceSuccess.value = ''
  showServiceModal.value = true
}

const openEditServiceModal = (service) => {
  editingService.value = service
  serviceForm.value = {
    id: service.id,
    name: service.name,
    description: service.description || '',
    price: service.price
  }
  serviceError.value = ''
  serviceSuccess.value = ''
  showServiceModal.value = true
}

const closeServiceModal = () => {
  showServiceModal.value = false
  editingService.value = null
  serviceError.value = ''
  serviceSuccess.value = ''
}

const saveService = async () => {
  if (!serviceForm.value.name || !serviceForm.value.price) {
    serviceError.value = 'Заполните название и цену услуги'
    return
  }

  if (serviceForm.value.price < 0) {
    serviceError.value = 'Цена не может быть отрицательной'
    return
  }

  serviceSaving.value = true
  serviceError.value = ''
  serviceSuccess.value = ''

  try {
    const token = localStorage.getItem('token')
    let response

    if (editingService.value) {
      response = await axios.put(
        `${API_URL}/services/${serviceForm.value.id}`,
        {
          name: serviceForm.value.name,
          description: serviceForm.value.description,
          price: parseFloat(serviceForm.value.price)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('✅ Услуга обновлена:', response.data)
    } else {
      response = await axios.post(
        `${API_URL}/services`,
        {
          name: serviceForm.value.name,
          description: serviceForm.value.description,
          price: parseFloat(serviceForm.value.price)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('✅ Услуга добавлена:', response.data)
    }

    await serviceStore.fetchServices()
    
    serviceSuccess.value = editingService.value ? 'Услуга успешно обновлена' : 'Услуга успешно добавлена'
    
    setTimeout(() => {
      closeServiceModal()
    }, 1500)
    
  } catch (err) {
    console.error('❌ Ошибка сохранения услуги:', err)
    if (err.response) {
      console.error('Статус ошибки:', err.response.status)
      console.error('Данные ошибки:', err.response.data)
      serviceError.value = err.response.data?.error || 'Ошибка при сохранении услуги'
    } else {
      serviceError.value = 'Ошибка соединения с сервером'
    }
  } finally {
    serviceSaving.value = false
  }
}

const confirmDeleteService = (service) => {
  serviceToDelete.value = service
  deleteServiceError.value = ''
  deleteServiceSuccess.value = ''
  showDeleteServiceModal.value = true
}

const closeDeleteServiceModal = () => {
  showDeleteServiceModal.value = false
  serviceToDelete.value = null
  deleteServiceLoading.value = false
  deleteServiceError.value = ''
  deleteServiceSuccess.value = ''
}

const confirmDeleteServiceAction = async () => {
  if (!serviceToDelete.value) return
  
  deleteServiceLoading.value = true
  deleteServiceError.value = ''
  deleteServiceSuccess.value = ''

  try {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_URL}/services/${serviceToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    await serviceStore.fetchServices()
    
    deleteServiceSuccess.value = 'Услуга успешно удалена'
    
    setTimeout(() => {
      closeDeleteServiceModal()
    }, 1500)
    
  } catch (err) {
    console.error('❌ Ошибка удаления услуги:', err)
    deleteServiceError.value = err.response?.data?.error || 'Ошибка при удалении услуги'
    deleteServiceLoading.value = false
  }
}

// ========== УПРАВЛЕНИЕ ЗАПЧАСТЯМИ ==========
const openAddPartModal = () => {
  editingPart.value = null
  partForm.value = {
    id: null,
    name: '',
    description: '',
    quantity: 0,
    price: null
  }
  partError.value = ''
  partSuccess.value = ''
  showPartModal.value = true
}

const openEditPartModal = (part) => {
  editingPart.value = part
  partForm.value = {
    id: part.id,
    name: part.name,
    description: part.description || '',
    quantity: part.quantity,
    price: part.price
  }
  partError.value = ''
  partSuccess.value = ''
  showPartModal.value = true
}

const closePartModal = () => {
  showPartModal.value = false
  editingPart.value = null
  partError.value = ''
  partSuccess.value = ''
}

const savePart = async () => {
  if (!partForm.value.name || !partForm.value.price || partForm.value.quantity === undefined) {
    partError.value = 'Заполните название, количество и цену запчасти'
    return
  }

  if (partForm.value.quantity < 0) {
    partError.value = 'Количество не может быть отрицательным'
    return
  }

  if (partForm.value.price < 0) {
    partError.value = 'Цена не может быть отрицательной'
    return
  }

  partSaving.value = true
  partError.value = ''
  partSuccess.value = ''

  try {
    const token = localStorage.getItem('token')
    let response

    if (editingPart.value) {
      response = await axios.put(
        `${API_URL}/parts/${partForm.value.id}`,
        {
          name: partForm.value.name,
          description: partForm.value.description,
          quantity: parseInt(partForm.value.quantity),
          price: parseFloat(partForm.value.price)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('✅ Запчасть обновлена:', response.data)
    } else {
      response = await axios.post(
        `${API_URL}/parts`,
        {
          name: partForm.value.name,
          description: partForm.value.description,
          quantity: parseInt(partForm.value.quantity),
          price: parseFloat(partForm.value.price)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      console.log('✅ Запчасть добавлена:', response.data)
    }

    await partStore.fetchParts()
    
    partSuccess.value = editingPart.value ? 'Запчасть успешно обновлена' : 'Запчасть успешно добавлена'
    
    setTimeout(() => {
      closePartModal()
    }, 1500)
    
  } catch (err) {
    console.error('❌ Ошибка сохранения запчасти:', err)
    if (err.response) {
      console.error('Статус ошибки:', err.response.status)
      console.error('Данные ошибки:', err.response.data)
      partError.value = err.response.data?.error || 'Ошибка при сохранении запчасти'
    } else {
      partError.value = 'Ошибка соединения с сервером'
    }
  } finally {
    partSaving.value = false
  }
}

const updatePartQuantity = async (part) => {
  if (part.quantity < 0) {
    part.quantity = 0
    return
  }

  updatingPartId.value = part.id
  updateSuccessId.value = null
  
  console.log(`🔄 Обновление количества запчасти #${part.id}: ${part.quantity}`)

  try {
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('Токен не найден')
    }

    const response = await axios.put(
      `${API_URL}/parts/${part.id}/quantity`,
      { quantity: part.quantity },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    )

    console.log('✅ Количество обновлено:', response.data)
    
    const index = partStore.parts.findIndex(p => p.id === part.id)
    if (index !== -1) {
      partStore.parts[index] = response.data.part
    }
    
    updateSuccessId.value = part.id
    setTimeout(() => {
      updateSuccessId.value = null
    }, 1500)

  } catch (err) {
    console.error('❌ Ошибка обновления количества:', err)
    
    if (err.response) {
      console.error('Статус ошибки:', err.response.status)
      console.error('Данные ошибки:', err.response.data)
      alert(err.response.data?.error || 'Ошибка при обновлении количества')
    } else {
      alert('Ошибка соединения с сервером')
    }
    
    await partStore.fetchParts()
    
  } finally {
    updatingPartId.value = null
  }
}

const confirmDeletePart = (part) => {
  partToDelete.value = part
  deletePartError.value = ''
  deletePartSuccess.value = ''
  showDeletePartModal.value = true
}

const closeDeletePartModal = () => {
  showDeletePartModal.value = false
  partToDelete.value = null
  deletePartLoading.value = false
  deletePartError.value = ''
  deletePartSuccess.value = ''
}

const confirmDeletePartAction = async () => {
  if (!partToDelete.value) return
  
  deletePartLoading.value = true
  deletePartError.value = ''
  deletePartSuccess.value = ''

  try {
    const token = localStorage.getItem('token')
    await axios.delete(`${API_URL}/parts/${partToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    await partStore.fetchParts()
    
    deletePartSuccess.value = 'Запчасть успешно удалена'
    
    setTimeout(() => {
      closeDeletePartModal()
    }, 1500)
    
  } catch (err) {
    console.error('❌ Ошибка удаления запчасти:', err)
    deletePartError.value = err.response?.data?.error || 'Ошибка при удалении запчасти'
    deletePartLoading.value = false
  }
}

// ========== ОБЩИЕ ФУНКЦИИ ДЛЯ МОДАЛЬНОГО ОКНА УДАЛЕНИЯ ==========
const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteLoading.value = false
  deleteError.value = ''
  deleteSuccess.value = ''
  deleteItem.value = null
  deleteAction.value = null
}

const confirmDelete = async () => {
  if (!deleteAction.value) {
    closeDeleteModal()
    return
  }
  
  deleteLoading.value = true
  deleteError.value = ''
  deleteSuccess.value = ''
  
  try {
    await deleteAction.value()
  } catch (err) {
    deleteError.value = err.message || 'Ошибка при удалении'
    deleteLoading.value = false
  }
}
</script>

<style scoped>
.admin-page {
  padding: 40px 0;
}

.page-title {
  color: var(--chocolate-700);
  margin-bottom: 30px;
  font-size: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(102, 85, 68, 0.08);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 85, 68, 0.15);
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--chocolate-800);
}

.stat-label {
  font-size: 14px;
  color: var(--chocolate-500);
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid var(--chocolate-100);
  padding-bottom: 10px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  color: var(--chocolate-500);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tab-btn:hover {
  color: var(--chocolate-700);
}

.tab-btn--active {
  color: var(--chocolate-700);
  font-weight: 600;
}

.tab-btn--active::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--chocolate-600);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.table-header h2 {
  color: var(--chocolate-700);
  font-size: 20px;
}

.admin-table {
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(102, 85, 68, 0.08);
}

.admin-table th {
  background: var(--chocolate-50);
  color: var(--chocolate-700);
  font-weight: 600;
  padding: 15px;
  text-align: left;
}

.admin-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--chocolate-100);
}

.admin-table tr:hover td {
  background-color: var(--chocolate-50);
}

.admin-table select {
  padding: 5px 10px;
  border: 1px solid var(--chocolate-200);
  border-radius: 4px;
  color: var(--chocolate-700);
  background-color: white;
}

.quantity-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-input {
  width: 80px;
  padding: 5px;
  border: 1px solid var(--chocolate-200);
  border-radius: 4px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 5px 8px;
  margin: 0 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background-color: var(--chocolate-100);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn.edit:hover:not(:disabled) {
  color: var(--chocolate-700);
}

.action-btn.delete:hover:not(:disabled) {
  color: #dc2626;
}

.action-btn.restore {
  background-color: var(--chocolate-100);
  color: var(--chocolate-700);
  font-size: 14px;
  white-space: nowrap;
}

.action-btn.restore:hover:not(:disabled) {
  background-color: var(--chocolate-200);
}

.action-btn.pdf {
  background-color: var(--chocolate-600);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.action-btn.pdf:hover {
  background-color: var(--chocolate-700);
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.cancelled {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.in-progress {
  background-color: #dbeafe;
  color: #1e40af;
}

.low-stock {
  color: #dc2626;
  font-weight: 600;
}

.loader-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--chocolate-200);
  border-radius: 50%;
  border-top-color: var(--chocolate-700);
  animation: spin 0.6s linear infinite;
}

.success-check {
  display: inline-block;
  width: 16px;
  height: 16px;
  color: #10b981;
  font-weight: bold;
  font-size: 14px;
  animation: fadeIn 0.3s ease;
}

.loading {
  text-align: center;
  padding: 60px;
  color: var(--chocolate-500);
  font-size: 18px;
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
  margin-bottom: 20px;
  font-size: 24px;
}

.edit-order-modal,
.service-modal,
.part-modal {
  max-width: 500px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

.restore-modal, .delete-modal {
  text-align: center;
  max-width: 500px;
}

.restore-icon, .delete-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.restore-info {
  color: var(--chocolate-500);
  font-size: 14px;
  margin-top: 5px;
  margin-bottom: 20px;
}

.order-details-preview {
  background-color: var(--chocolate-50);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: left;
}

.order-details-preview div {
  margin-bottom: 5px;
  color: var(--chocolate-700);
}

.delete-modal p {
  color: var(--chocolate-600);
  margin-bottom: 20px;
  font-size: 16px;
}

.delete-details {
  background-color: var(--chocolate-50);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  color: var(--chocolate-700);
  font-size: 14px;
  white-space: pre-line;
  text-align: left;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--chocolate-700);
  font-weight: 500;
  font-size: 14px;
}

.modal-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--chocolate-200);
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.2s ease;
  background-color: white;
}

.modal-input:focus {
  outline: none;
  border-color: var(--chocolate-600);
  box-shadow: 0 0 0 3px rgba(127, 107, 88, 0.1);
}

.modal-input:disabled {
  background-color: var(--chocolate-50);
  cursor: not-allowed;
}

textarea.modal-input {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 30px;
  flex-wrap: wrap;
}

.error-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  text-align: center;
}

.success-message {
  margin-top: 20px;
  padding: 12px;
  background-color: #d1fae5;
  color: #065f46;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #a7f3d0;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .tabs {
    justify-content: flex-start;
  }
  
  .tab-btn {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .admin-table {
    font-size: 14px;
  }
  
  .admin-table th,
  .admin-table td {
    padding: 8px 10px;
  }
  
  .modal-content {
    padding: 30px 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
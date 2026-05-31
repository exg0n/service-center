<template>
  <header class="app-header">
    <div class="container header-container">
      <div class="logo" @click="navigateHome">
        <span class="logo-text">ServiceCenter</span>
      </div>

      <nav class="nav-menu">
        <router-link to="/" class="nav-link" active-class="nav-link--active">Главная</router-link>
        <router-link to="/services" class="nav-link" active-class="nav-link--active">Услуги</router-link>
        <router-link to="/status" class="nav-link" active-class="nav-link--active">Статус заказа</router-link>
        
        <router-link 
          v-if="userStore.isAdmin || userStore.isManager" 
          to="/admin" 
          class="nav-link" 
          active-class="nav-link--active"
        >
          Управление
        </router-link>
      </nav>

      <div class="user-menu">
        <template v-if="userStore.isAuthenticated">
          <div class="user-info">
            <span class="user-name">{{ userStore.fullName || 'Пользователь' }}</span>
            <span class="user-role" :class="getRoleClass">
              {{ getRoleText }}
            </span>
          </div>
          
          <router-link :to="getDashboardLink">
            <ChocolateButton variant="outline">
              {{ getDashboardText }}
            </ChocolateButton>
          </router-link>
          
          <ChocolateButton variant="secondary" @click="handleLogout">
            Выйти
          </ChocolateButton>
        </template>
        <template v-else>
          <ChocolateButton variant="outline" @click="goToLogin">
            Войти
          </ChocolateButton>
          <ChocolateButton variant="primary" @click="goToRegister">
            Регистрация
          </ChocolateButton>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useUserStore } from '../../stores/userStore'  // Исправленный путь
import ChocolateButton from '../ui/ChocolateButton.vue'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()

const navigateHome = () => {
  router.push('/')
}

const goToLogin = () => {
  router.push('/login')
}

const goToRegister = () => {
  router.push('/register')
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

const getDashboardText = computed(() => {
  if (userStore.isAdmin) return 'Панель администратора'
  if (userStore.isManager) return 'Панель менеджера'
  return 'Личный кабинет'
})

const getDashboardLink = computed(() => {
  if (userStore.isAdmin) return '/admin'
  if (userStore.isManager) return '/manager'
  return '/profile'
})

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
</script>

<style scoped>
.app-header {
  background-color: white;
  box-shadow: 0 2px 8px rgba(102, 85, 68, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.logo {
  cursor: pointer;
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--chocolate-700);
  letter-spacing: -0.5px;
}

.nav-menu {
  display: flex;
  gap: 32px;
}

.nav-link {
  color: var(--chocolate-600);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--chocolate-800);
}

.nav-link--active {
  color: var(--chocolate-700);
  font-weight: 600;
}

.nav-link--active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--chocolate-600);
  border-radius: 2px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 8px;
}

.user-name {
  color: var(--chocolate-700);
  font-weight: 600;
  font-size: 14px;
}

.user-role {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 2px;
}

.role-admin {
  background-color: #fee2e2;
  color: #991b1b;
}

.role-manager {
  background-color: #dbeafe;
  color: #1e40af;
}

.role-user {
  background-color: #d1fae5;
  color: #065f46;
}

@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    height: auto;
    padding: 10px 0;
  }
  
  .nav-menu {
    margin: 10px 0;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .user-menu {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
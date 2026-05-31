<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">Вход в систему</h1>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Email -->
          <ChocolateInput
            id="email"
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="Введите ваш email"
            :error="errors.email"
            @blur="validateField('email')"
          />
          
          <!-- Пароль -->
          <ChocolateInput
            id="password"
            v-model="form.password"
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            :error="errors.password"
            @blur="validateField('password')"
          />
          
          <!-- Сообщение об ошибке -->
          <div v-if="authError" class="error-message">
            {{ authError }}
          </div>
          
          <!-- Кнопка входа -->
          <ChocolateButton 
            type="submit" 
            variant="primary" 
            :fullWidth="true"
            :disabled="!isFormValid || loading"
          >
            <span v-if="loading" class="loader"></span>
            <span v-else>Войти</span>
          </ChocolateButton>
        </form>
        
        <div class="login-footer">
          <p>Нет аккаунта?</p>
          <router-link to="/register" class="register-link">
            Зарегистрироваться
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/userStore'  // Исправленный путь
import ChocolateInput from './ui/ChocolateInput.vue'
import ChocolateButton from './ui/ChocolateButton.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Форма
const form = reactive({
  email: '',
  password: ''
})

// Ошибки валидации
const errors = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const authError = ref('')

// Валидация полей
const validateField = (field) => {
  switch (field) {
    case 'email':
      if (!form.email) {
        errors.email = 'Email обязателен'
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.email = 'Введите корректный email'
      } else {
        errors.email = ''
      }
      break
      
    case 'password':
      if (!form.password) {
        errors.password = 'Пароль обязателен'
      } else if (form.password.length < 6) {
        errors.password = 'Пароль должен быть не менее 6 символов'
      } else {
        errors.password = ''
      }
      break
  }
}

// Валидация всей формы
const isFormValid = computed(() => {
  return form.email && form.password && !errors.email && !errors.password
})

// Обработка входа
const handleLogin = async () => {
  // Валидация всех полей
  validateField('email')
  validateField('password')
  
  if (!isFormValid.value) return
  
  loading.value = true
  authError.value = ''
  
  const result = await userStore.login(form.email, form.password)
  
  if (result.success) {
    const redirectPath = route.query.redirect || '/'
    router.push(redirectPath)
  } else {
    authError.value = result.error
  }
  
  loading.value = false
}

// Заполнение демо-аккаунта
const fillDemoAccount = (email, password) => {
  form.email = email
  form.password = password
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, var(--chocolate-50) 0%, var(--chocolate-100) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-container {
  width: 100%;
  max-width: 450px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(102, 85, 68, 0.15);
  animation: slideUp 0.5s ease;
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

.login-title {
  text-align: center;
  color: var(--chocolate-700);
  font-size: 28px;
  margin-bottom: 30px;
  font-weight: 600;
}

.login-form {
  margin-bottom: 20px;
}

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
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

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--chocolate-100);
}

.login-footer p {
  color: var(--chocolate-500);
  margin-bottom: 8px;
}

.register-link {
  color: var(--chocolate-700);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: var(--chocolate-800);
  text-decoration: underline;
}

.demo-accounts {
  margin-top: 30px;
  padding: 20px;
  background-color: var(--chocolate-50);
  border-radius: 12px;
}

.demo-title {
  color: var(--chocolate-600);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
}

.demo-account {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 8px;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--chocolate-100);
}

.demo-account:hover {
  transform: translateX(5px);
  border-color: var(--chocolate-300);
  box-shadow: 0 2px 8px rgba(102, 85, 68, 0.1);
}

.demo-role {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.demo-role.admin {
  background-color: #fee2e2;
  color: #991b1b;
}

.demo-role.manager {
  background-color: #dbeafe;
  color: #1e40af;
}

.demo-role.user {
  background-color: #d1fae5;
  color: #065f46;
}

.demo-account span:last-child {
  color: var(--chocolate-600);
  font-size: 14px;
}
</style>
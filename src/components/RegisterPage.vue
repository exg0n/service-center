<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <h1 class="register-title">Регистрация</h1>
        
        <form @submit.prevent="handleRegister" class="register-form">
          <!-- Имя -->
          <ChocolateInput
            id="first_name"
            v-model="form.first_name"
            label="Имя *"
            placeholder="Введите ваше имя"
            :error="errors.first_name"
            @blur="validateField('first_name')"
          />
          
          <!-- Фамилия -->
          <ChocolateInput
            id="last_name"
            v-model="form.last_name"
            label="Фамилия *"
            placeholder="Введите вашу фамилию"
            :error="errors.last_name"
            @blur="validateField('last_name')"
          />
          
          <!-- Email -->
          <ChocolateInput
            id="email"
            v-model="form.email"
            label="Email *"
            type="email"
            placeholder="example@mail.com"
            :error="errors.email"
            @blur="validateField('email')"
          />
          
          <!-- Телефон -->
          <ChocolateInput
            id="phone"
            v-model="form.phone"
            label="Телефон"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            :error="errors.phone"
            @blur="validateField('phone')"
          />
          
          <!-- Пароль -->
          <ChocolateInput
            id="password"
            v-model="form.password"
            label="Пароль *"
            type="password"
            placeholder="Не менее 6 символов"
            :error="errors.password"
            @blur="validateField('password')"
          />
          
          <!-- Подтверждение пароля -->
          <ChocolateInput
            id="password_confirmation"
            v-model="form.password_confirmation"
            label="Подтверждение пароля *"
            type="password"
            placeholder="Повторите пароль"
            :error="errors.password_confirmation"
            @blur="validateField('password_confirmation')"
          />
          
          <!-- Сообщение об ошибке -->
          <div v-if="registerError" class="error-message">
            {{ registerError }}
          </div>
          
          <!-- Сообщение об успехе -->
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
          
          <!-- Кнопка регистрации -->
          <ChocolateButton 
            type="submit" 
            variant="primary" 
            :fullWidth="true"
            :disabled="!isFormValid || loading"
          >
            <span v-if="loading" class="loader"></span>
            <span v-else>Зарегистрироваться</span>
          </ChocolateButton>
        </form>
        
        <div class="register-footer">
          <p>Уже есть аккаунт?</p>
          <router-link to="/login" class="login-link">
            Войти
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'  // Исправленный путь
import ChocolateInput from './ui/ChocolateInput.vue'
import ChocolateButton from './ui/ChocolateButton.vue'

const router = useRouter()
const userStore = useUserStore()

// Форма с новыми полями
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: ''
})

// Ошибки валидации
const errors = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: ''
})

const loading = ref(false)
const registerError = ref('')
const successMessage = ref('')

// Валидация полей
const validateField = (field) => {
  switch (field) {
    case 'first_name':
      if (!form.first_name) {
        errors.first_name = 'Имя обязательно'
      } else if (form.first_name.length < 2) {
        errors.first_name = 'Имя должно быть не менее 2 символов'
      } else {
        errors.first_name = ''
      }
      break
      
    case 'last_name':
      if (!form.last_name) {
        errors.last_name = 'Фамилия обязательна'
      } else if (form.last_name.length < 2) {
        errors.last_name = 'Фамилия должна быть не менее 2 символов'
      } else {
        errors.last_name = ''
      }
      break
      
    case 'email':
      if (!form.email) {
        errors.email = 'Email обязателен'
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        errors.email = 'Введите корректный email'
      } else {
        errors.email = ''
      }
      break
      
    case 'phone':
      // Необязательное поле, но если заполнено - проверяем формат
      if (form.phone && !/^[\d\s\+\-\(\)]{10,}$/.test(form.phone)) {
        errors.phone = 'Введите корректный номер телефона'
      } else {
        errors.phone = ''
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
      // При изменении пароля проверяем и подтверждение
      if (form.password_confirmation) {
        validateField('password_confirmation')
      }
      break
      
    case 'password_confirmation':
      if (!form.password_confirmation) {
        errors.password_confirmation = 'Подтверждение пароля обязательно'
      } else if (form.password_confirmation !== form.password) {
        errors.password_confirmation = 'Пароли не совпадают'
      } else {
        errors.password_confirmation = ''
      }
      break
  }
}

// Валидация всей формы
const isFormValid = computed(() => {
  return form.first_name && 
         form.last_name && 
         form.email && 
         form.password && 
         form.password_confirmation &&
         !errors.first_name && 
         !errors.last_name && 
         !errors.email && 
         !errors.password && 
         !errors.password_confirmation
})

// Обработка регистрации
const handleRegister = async () => {
  // Валидация всех полей
  Object.keys(form).forEach(field => validateField(field))
  
  if (!isFormValid.value) return
  
  loading.value = true
  registerError.value = ''
  successMessage.value = ''
  
  // Отправляем данные в store
  const result = await userStore.register({ 
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone,
    password: form.password
  })
  
  if (result.success) {
    successMessage.value = 'Регистрация прошла успешно! Сейчас вы будете перенаправлены на страницу входа.'
    
    // Очистка формы
    form.first_name = ''
    form.last_name = ''
    form.email = ''
    form.phone = ''
    form.password = ''
    form.password_confirmation = ''
    
    // Перенаправление на страницу входа через 2 секунды
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } else {
    registerError.value = result.error
  }
  
  loading.value = false
}
</script>

<style scoped>
.register-page {
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, var(--chocolate-50) 0%, var(--chocolate-100) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.register-container {
  width: 100%;
  max-width: 500px;
}

.register-card {
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

.register-title {
  text-align: center;
  color: var(--chocolate-700);
  font-size: 28px;
  margin-bottom: 30px;
  font-weight: 600;
}

.register-form {
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

.success-message {
  background-color: #d1fae5;
  color: #065f46;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  border: 1px solid #a7f3d0;
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

.register-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--chocolate-100);
}

.register-footer p {
  color: var(--chocolate-500);
  margin-bottom: 8px;
}

.login-link {
  color: var(--chocolate-700);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.login-link:hover {
  color: var(--chocolate-800);
  text-decoration: underline;
}
</style>
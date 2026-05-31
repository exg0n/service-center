import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 0);
  const isManager = computed(() => user.value?.role === 1);
  const isRegularUser = computed(() => user.value?.role === 2);

  // Полное имя для отображения
  const fullName = computed(() => {
    if (!user.value) return '';
    const first = user.value.first_name || '';
    const last = user.value.last_name || '';
    return `${first} ${last}`.trim();
  });

  // Регистрация с first_name и last_name
  const register = async (userData) => {
    loading.value = true;
    error.value = null;

    try {
      console.log('📝 Отправка запроса на регистрацию:', {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone
      });

      const response = await api.post('/auth/register', {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || ''
      });

      console.log('✅ Ответ от сервера:', response.data);

      return {
        success: true,
        message: response.data.message || 'Регистрация прошла успешно!'
      };
    } catch (err) {
      console.error('❌ Ошибка регистрации:', err.response?.data || err.message);

      if (!err.response) {
        error.value = 'Сервер не отвечает. Запустите backend (npm run dev в папке backend)';
      } else {
        error.value = err.response?.data?.error || 'Ошибка при регистрации';
      }

      return {
        success: false,
        error: error.value
      };
    } finally {
      loading.value = false;
    }
  };

  // Вход
  const login = async (email, password) => {
    loading.value = true;
    error.value = null;

    try {
      console.log('🔐 Отправка запроса на вход:', { email });

      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });

      console.log('✅ Ответ от сервера:', response.data);

      if (response.data.token) {
        token.value = response.data.token;
        user.value = response.data.user;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        return { success: true };
      } else {
        throw new Error('Токен не получен');
      }
    } catch (err) {
      console.error('❌ Ошибка входа:', err.response?.data || err.message);

      if (!err.response) {
        error.value = 'Сервер не отвечает. Запустите backend (npm run dev в папке backend)';
      } else {
        error.value = err.response?.data?.error || 'Неверный email или пароль';
      }

      return {
        success: false,
        error: error.value
      };
    } finally {
      loading.value = false;
    }
  };

  // Проверка авторизации
  const checkAuth = async () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        console.log('🔍 Проверка авторизации...');

        const response = await api.get('/auth/me');

        if (response.data.user) {
          user.value = response.data.user;
          token.value = savedToken;
          console.log('✅ Авторизация подтверждена');
          return true;
        } else {
          console.log('❌ Авторизация не подтверждена');
          logout();
          return false;
        }
      } catch (err) {
        console.error('❌ Ошибка проверки авторизации:', err);
        logout();
        return false;
      }
    }
    return false;
  };

  // Выход
  const logout = () => {
    user.value = null;
    token.value = null;
    error.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('👋 Выход выполнен');
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isManager,
    isRegularUser,
    fullName,
    register,
    login,
    logout,
    checkAuth
  };
});
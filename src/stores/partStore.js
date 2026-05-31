import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const usePartStore = defineStore('parts', () => {
    const parts = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Получить все запчасти
    const fetchParts = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get('/parts');
            parts.value = response.data;
            return response.data;
        } catch (err) {
            console.error('❌ Ошибка получения запчастей:', err);
            error.value = err.response?.data?.error || 'Ошибка при получении запчастей';
            return [];
        } finally {
            loading.value = false;
        }
    };

    return {
        parts,
        loading,
        error,
        fetchParts
    };
});
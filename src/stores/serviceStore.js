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

export const useServiceStore = defineStore('services', () => {
    const services = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Получить все услуги
    const fetchServices = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get('/services');
            services.value = response.data;
            return response.data;
        } catch (err) {
            console.error('❌ Ошибка получения услуг:', err);
            error.value = err.response?.data?.error || 'Ошибка при получении услуг';
            return [];
        } finally {
            loading.value = false;
        }
    };

    return {
        services,
        loading,
        error,
        fetchServices
    };
});
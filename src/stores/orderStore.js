/**
 * Хранилище заказов (Pinia Store).
 * Управляет состоянием заказов: получение, создание, обновление статуса.
 * 
 * @module orderStore
 * @requires pinia
 * @requires axios
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

/**
 * Настроенный экземпляр axios с интерцептором для добавления JWT.
 * @constant {import('axios').AxiosInstance}
 */

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

export const useOrderStore = defineStore('orders', () => {
    const orders = ref([]);
    const archivedOrders = ref([]);
    const activeOrders = ref([]);
    const userOrders = ref([]);
    const currentOrder = ref(null);
    const loading = ref(false);
    const error = ref(null);

    /**
     * Получает список всех заказов (требуются права администратора).
     * 
     * @async
     * @function fetchAllOrders
     * @returns {Promise<Array>} Массив заказов
     * @throws {Error} При ошибке запроса (сохраняется в error)
     * 
     * @example
     * const orders = await orderStore.fetchAllOrders()
     * console.log(orders[0].order_number)
     */

    // Получить все заказы (для админа)
    const fetchAllOrders = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get('/admin/orders');
            orders.value = response.data;
            return response.data;
        } catch (err) {
            console.error('❌ Ошибка получения заказов:', err);
            error.value = err.response?.data?.error || 'Ошибка при получении заказов';
            return [];
        } finally {
            loading.value = false;
        }
    };

    // Получить архивированные заказы
    const fetchArchivedOrders = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get('/orders/archived');
            archivedOrders.value = response.data;
            return response.data;
        } catch (err) {
            console.error('❌ Ошибка получения архивированных заказов:', err);
            error.value = err.response?.data?.error || 'Ошибка при получении архивированных заказов';
            return [];
        } finally {
            loading.value = false;
        }
    };

    // Получить активные заказы
    const fetchActiveOrders = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get('/orders/active');
            activeOrders.value = response.data;
            return response.data;
        } catch (err) {
            console.error('❌ Ошибка получения активных заказов:', err);
            error.value = err.response?.data?.error || 'Ошибка при получении активных заказов';
            return [];
        } finally {
            loading.value = false;
        }
    };

    // Получить заказы текущего пользователя
    const fetchUserOrders = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.get('/user/orders');
            userOrders.value = response.data;
            return response.data;
        } catch (err) {
            console.error('❌ Ошибка получения заказов пользователя:', err);
            error.value = err.response?.data?.error || 'Ошибка при получении заказов';
            return [];
        } finally {
            loading.value = false;
        }
    };

    // Поиск заказа по номеру
    const findOrderByNumber = async (orderNumber) => {
        loading.value = true;
        error.value = null;

        try {
            console.log('🔍 Поиск заказа по номеру:', orderNumber);
            const response = await api.get(`/orders/search/${encodeURIComponent(orderNumber)}`);
            console.log('✅ Заказ найден:', response.data);
            return response.data;
        } catch (err) {
            console.error('❌ Ошибка при поиске заказа:', err);
            if (err.response?.status === 404) {
                return null;
            }
            error.value = err.response?.data?.error || 'Ошибка при поиске заказа';
            return null;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Создаёт новый заказ.
     * 
     * @async
     * @function createOrder
     * @param {Object} orderData - Данные заказа
     * @param {number} orderData.service_id - ID услуги
     * @param {string} orderData.device_type - Тип устройства
     * @param {string|null} orderData.device_model - Модель устройства (опционально)
     * @param {string} orderData.problem_description - Описание проблемы
     * @returns {Promise<Object>} Результат операции
     * @returns {boolean} return.success - Успех операции
     * @returns {Object} [return.order] - Созданный заказ
     * @returns {string} [return.orderNumber] - Номер заказа
     * @returns {string} [return.error] - Сообщение об ошибке
     * 
     * @example
     * const result = await orderStore.createOrder({
     *   service_id: 1,
     *   device_type: 'Смартфон',
     *   device_model: 'iPhone 12',
     *   problem_description: 'Не включается'
     * })
     * if (result.success) {
     *   console.log(`Заказ создан: ${result.orderNumber}`)
     * }
     */

    // Создать новый заказ
    const createOrder = async (orderData) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.post('/orders', orderData);

            console.log('✅ Ответ от сервера:', response.data);

            // Проверяем структуру ответа
            let orderNumber = null;

            if (response.data.order && response.data.order.order_number) {
                orderNumber = response.data.order.order_number;
            } else if (response.data.order_number) {
                orderNumber = response.data.order_number;
            } else if (response.data.order && response.data.order.out_order_number) {
                orderNumber = response.data.order.out_order_number;
            } else if (response.data.out_order_number) {
                orderNumber = response.data.out_order_number;
            }

            // Обновляем список заказов пользователя
            await fetchUserOrders();

            return {
                success: true,
                order: response.data.order || response.data,
                orderNumber: orderNumber,
                message: response.data.message || 'Заказ успешно создан'
            };
        } catch (err) {
            console.error('❌ Ошибка создания заказа:', err);
            error.value = err.response?.data?.error || 'Ошибка при создании заказа';
            return {
                success: false,
                error: error.value
            };
        } finally {
            loading.value = false;
        }
    };

    // Обновить статус заказа
    const updateOrderStatus = async (orderId, status) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put(`/orders/${orderId}/status`, { status });

            // Обновляем все списки заказов
            await fetchAllOrders();
            await fetchActiveOrders();
            await fetchArchivedOrders();
            await fetchUserOrders();

            return {
                success: true,
                order: response.data.order,
                message: response.data.message
            };
        } catch (err) {
            console.error('❌ Ошибка обновления статуса:', err);
            error.value = err.response?.data?.error || 'Ошибка при обновлении статуса';
            return {
                success: false,
                error: error.value
            };
        } finally {
            loading.value = false;
        }
    };

    // Восстановить заказ из архива
    const restoreOrder = async (orderId) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await api.put(`/orders/${orderId}/restore`);

            // Обновляем все списки заказов
            await fetchAllOrders();
            await fetchActiveOrders();
            await fetchArchivedOrders();
            await fetchUserOrders();

            return {
                success: true,
                order: response.data.order,
                message: response.data.message
            };
        } catch (err) {
            console.error('❌ Ошибка восстановления заказа:', err);
            error.value = err.response?.data?.error || 'Ошибка при восстановлении заказа';
            return {
                success: false,
                error: error.value
            };
        } finally {
            loading.value = false;
        }
    };

    return {
        orders,
        archivedOrders,
        activeOrders,
        userOrders,
        currentOrder,
        loading,
        error,
        fetchAllOrders,
        fetchArchivedOrders,
        fetchActiveOrders,
        fetchUserOrders,
        findOrderByNumber,
        createOrder,
        updateOrderStatus,
        restoreOrder
    };
});
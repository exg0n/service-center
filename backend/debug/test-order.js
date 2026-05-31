// backend/test-order.js
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function test() {
    try {
        // 1. Логинимся
        console.log('🔐 Логин...');
        const login = await axios.post(`${API_URL}/auth/login`, {
            email: 'enbaev@gmail.com',
            password: 'qweasd'
        });

        const token = login.data.token;
        console.log('✅ Успешный вход\n');

        // 2. Получаем все заказы
        console.log('📊 Все заказы:');
        const orders = await axios.get(`${API_URL}/admin/orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        orders.data.forEach(order => {
            console.log(`   #${order.order_number} | Статус: ${order.status} | Клиент: ${order.user_name}`);
        });
        console.log('');

        // 3. Находим первый активный заказ
        const activeOrder = orders.data.find(o => !['completed', 'cancelled'].includes(o.status));
        if (!activeOrder) {
            console.log('❌ Нет активных заказов для теста');
            return;
        }

        console.log(`🧪 Тестовый заказ: #${activeOrder.order_number} (ID: ${activeOrder.id})`);
        console.log(`   Текущий статус: ${activeOrder.status}`);

        // 4. Меняем статус на "Отменен"
        console.log(`\n🔄 Меняем статус на "cancelled"...`);
        const update = await axios.put(
            `${API_URL}/orders/${activeOrder.id}/status`,
            { status: 'cancelled' },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log(`✅ Статус изменен: ${update.data.order.status}`);

        // 5. Проверяем архив
        console.log(`\n📦 Проверяем архив...`);
        const archive = await axios.get(`${API_URL}/orders/archive`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const archivedOrder = archive.data.find(o => o.id === activeOrder.id);
        if (archivedOrder) {
            console.log(`✅ Заказ #${archivedOrder.order_number} найден в архиве`);
            console.log(`   Статус в архиве: ${archivedOrder.status}`);
        } else {
            console.log(`❌ Заказ не найден в архиве`);
        }

        // 6. Восстанавливаем заказ
        console.log(`\n🔄 Восстанавливаем заказ из архива...`);
        const restore = await axios.put(
            `${API_URL}/orders/${activeOrder.id}/restore`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log(`✅ Заказ восстановлен`);
        console.log(`   Новый статус: ${restore.data.order.status}`);

        // 7. Проверяем финальное состояние
        console.log(`\n✅ Тест завершен успешно!`);

    } catch (error) {
        console.error('\n❌ ОШИБКА:');
        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);
            console.error(`   Сообщение:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

test();
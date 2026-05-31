// backend/debug/test-debug.js
const axios = require('axios');

const DEBUG_URL = 'http://localhost:3001/api/debug';

async function test() {
    console.log('🔍 ТЕСТИРОВАНИЕ DEBUG СЕРВЕРА\n');
    console.log('=================================\n');

    try {
        // 1. Проверяем соединение
        console.log('1. Проверка соединения...');
        const test = await axios.get(`${DEBUG_URL}/test`);
        console.log('   ✅ Сервер работает');
        console.log('   ', test.data, '\n');

        // 2. Получаем заказ #3
        const orderId = 3;
        console.log(`2. Получение заказа #${orderId}...`);
        const orderInfo = await axios.get(`${DEBUG_URL}/orders/${orderId}`);
        console.log('   ✅ Текущий статус:', orderInfo.data.status, '\n');

        // 3. Пробуем изменить статус на "cancelled"
        console.log(`3. Изменение статуса на "cancelled"...`);
        const response = await axios.put(
            `${DEBUG_URL}/orders/${orderId}/status`,
            { status: 'cancelled' }
        );

        console.log('   ✅ Успех!');
        console.log('   Ответ:', response.data, '\n');

        // 4. Проверяем новый статус
        console.log(`4. Проверка нового статуса...`);
        const finalOrder = await axios.get(`${DEBUG_URL}/orders/${orderId}`);
        console.log('   ✅ Новый статус:', finalOrder.data.status);

        // 5. Восстанавливаем обратно на pending для следующих тестов
        console.log(`\n5. Восстановление статуса на "pending"...`);
        const restoreResponse = await axios.put(
            `${DEBUG_URL}/orders/${orderId}/status`,
            { status: 'pending' }
        );
        console.log('   ✅ Статус восстановлен');

    } catch (error) {
        console.error('\n❌ ОШИБКА:');
        if (error.response) {
            console.error('Статус:', error.response.status);
            console.error('Детали:', error.response.data);
        } else {
            console.error(error.message);
        }
    }

    console.log('\n=================================');
    console.log('🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
}

test();
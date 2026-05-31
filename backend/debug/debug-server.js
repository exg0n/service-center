// backend/debug/debug-server.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
});

// Проверка подключения
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err);
    } else {
        console.log('✅ Подключение к БД успешно');
        release();
    }
});

// ИСПРАВЛЕННАЯ функция обновления статуса
async function updateOrderStatus(orderId, status) {
    console.log(`\n🔄 Обновление заказа ${orderId} на статус ${status}`);

    // 1. Проверяем существование заказа
    console.log('1. Проверка существования заказа...');
    const checkOrder = await pool.query(
        'SELECT id, order_number, status FROM orders WHERE id = $1',
        [orderId]
    );

    if (checkOrder.rows.length === 0) {
        throw new Error('Заказ не найден');
    }
    console.log('   ✓ Заказ найден:', checkOrder.rows[0]);

    // 2. ИСПРАВЛЕНО: явное приведение типов
    console.log('2. Выполнение UPDATE...');
    const updateQuery = `
        UPDATE orders 
        SET status = $1::varchar,
            completed_at = CASE 
                WHEN $1::varchar = 'completed' THEN CURRENT_DATE 
                ELSE completed_at 
            END
        WHERE id = $2::integer
        RETURNING id, order_number, status, completed_at
    `;

    console.log('   SQL:', updateQuery);
    console.log('   Параметры:', [status, orderId]);

    const result = await pool.query(updateQuery, [status, orderId]);
    console.log('   Результат:', result.rows[0]);

    return result.rows[0];
}

// Тестовый endpoint
app.put('/api/debug/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log('\n=== DEBUG: Запрос на изменение статуса ===');
        console.log('ID заказа:', id);
        console.log('Новый статус:', status);

        const order = await updateOrderStatus(parseInt(id), status);

        res.json({
            success: true,
            message: 'Статус обновлен',
            order
        });

    } catch (error) {
        console.error('❌ Ошибка в debug endpoint:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Получить информацию о заказе
app.get('/api/debug/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );

        res.json(result.rows[0] || { error: 'Заказ не найден' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить все заказы
app.get('/api/debug/orders', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, order_number, status FROM orders ORDER BY id'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Простой тестовый endpoint
app.get('/api/debug/test', (req, res) => {
    res.json({
        message: 'Debug server is running',
        time: new Date().toISOString()
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log('\n=================================');
    console.log(`🔧 Debug server запущен на порту ${PORT}`);
    console.log(`📡 Тест: http://localhost:${PORT}/api/debug/test`);
    console.log(`📦 Все заказы: http://localhost:${PORT}/api/debug/orders`);
    console.log(`🔍 Заказ по ID: http://localhost:${PORT}/api/debug/orders/3`);
    console.log('=================================\n');
});
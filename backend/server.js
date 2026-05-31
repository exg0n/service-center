/**
 * Серверное приложение сервисного центра.
 * @module server
 * @requires express
 * @requires pg
 * @requires bcrypt
 * @requires jsonwebtoken
 * @requires pdfkit
 */

/**
 * Глобальный пул подключений к PostgreSQL.
 * @type {import('pg').Pool}
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Создаем папку для PDF если её нет
const pdfDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
}

/**
 * Пул соединений с базой данных PostgreSQL.
 * Настроен с SSL, таймаутами и максимальным количеством соединений.
 * 
 * @constant {import('pg').Pool}
 * @property {string} user - Пользователь БД из .env
 * @property {string} host - Хост БД из .env
 * @property {string} database - Имя БД из .env
 * @property {string} password - Пароль БД из .env
 * @property {number} port - Порт БД из .env
 * @property {Object} ssl - Настройки SSL (rejectUnauthorized: false)
 */

// Подключение к PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

// Устанавливаем часовой пояс для всех подключений
pool.on('connect', (client) => {
    client.query('SET TIME ZONE "Europe/Moscow"')
        .catch(err => console.error('❌ Ошибка установки часового пояса:', err));
});

// Обработка ошибок пула
pool.on('error', (err, client) => {
    console.error('❌ Неожиданная ошибка пула:', err);
});

// Проверка подключения к БД
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Ошибка подключения к базе данных:', err.stack);
    } else {
        console.log('✅ Успешное подключение к базе данных');
        release();
    }
});

/**
 * Генерирует PDF-документ (заказ-наряд и гарантийный талон) для заказа.
 *
 * @async
 * @function generateOrderPDF
 * @param {Object} orderData - Данные заказа для PDF
 * @param {string} orderData.order_number - Номер заказа
 * @param {Date} orderData.created_at - Дата создания
 * @param {Date|null} orderData.completed_at - Дата выполнения (если есть)
 * @param {string} orderData.user_name - ФИО клиента
 * @param {string} orderData.user_email - Email клиента
 * @param {string} orderData.service_name - Название услуги
 * @param {string} orderData.device_type - Тип устройства
 * @param {string|null} orderData.device_model - Модель устройства
 * @param {string} orderData.problem_description - Описание проблемы
 * @param {number} orderData.price - Стоимость
 * @param {string} orderData.status - Статус заказа
 * @returns {Promise<Object>} Объект с информацией о PDF
 * @returns {string} return.fileName - Имя файла PDF
 * @returns {string} return.filePath - Полный путь к файлу
 * @returns {string} return.downloadUrl - URL для скачивания
 * @throws {Error} При ошибках создания PDF или записи файла
 *
 * @example
 * const pdfInfo = await generateOrderPDF({
 *   order_number: 'ORD-2026-0001',
 *   user_name: 'Иван Петров',
 *   price: 1500,
 *   status: 'completed'
 * });
 */

// Функция для генерации PDF
const generateOrderPDF = async (orderData) => {
    return new Promise((resolve, reject) => {
        try {
            // Создаем документ
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                autoFirstPage: true,
                lang: 'ru-RU'
            });

            // Регистрируем системные шрифты Windows
            const fontsDir = 'C:/Windows/Fonts/';

            // Регистрируем шрифты Verdana (встроенные в Windows)
            doc.registerFont('Verdana', path.join(fontsDir, 'verdana.ttf'));
            doc.registerFont('Verdana-Bold', path.join(fontsDir, 'verdanab.ttf'));

            const fileName = `order_${orderData.order_number}_${Date.now()}.pdf`;
            const filePath = path.join(pdfDir, fileName);
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);

            // Устанавливаем шрифт Verdana
            doc.font('Verdana');

            // Заголовок
            doc.fontSize(20)
                .font('Verdana-Bold')
                .text('Сервисный центр', { align: 'center' });
            doc.moveDown();

            doc.fontSize(16)
                .font('Verdana-Bold')
                .text('ЗАКАЗ-НАРЯД И ГАРАНТИЙНЫЙ ТАЛОН', { align: 'center' });
            doc.moveDown(2);

            // Информация о заказе
            doc.fontSize(12)
                .font('Verdana')
                .text(`Номер заказа: ${orderData.order_number}`);
            doc.text(`Дата создания: ${new Date(orderData.created_at).toLocaleDateString('ru-RU')}`);
            if (orderData.completed_at) {
                doc.text(`Дата выполнения: ${new Date(orderData.completed_at).toLocaleDateString('ru-RU')}`);
            }
            doc.moveDown();

            // Информация о клиенте
            doc.fontSize(14)
                .font('Verdana-Bold')
                .text('Информация о клиенте:', { underline: true });
            doc.fontSize(12)
                .font('Verdana')
                .text(`Клиент: ${orderData.user_name || 'Не указан'}`);
            doc.text(`Email: ${orderData.user_email || 'Не указан'}`);
            doc.moveDown();

            // Информация об услуге
            doc.fontSize(14)
                .font('Verdana-Bold')
                .text('Информация об услуге:', { underline: true });
            doc.fontSize(12)
                .font('Verdana')
                .text(`Услуга: ${orderData.service_name || 'Не указана'}`);
            doc.text(`Устройство: ${orderData.device_type} ${orderData.device_model || ''}`);
            doc.text(`Описание проблемы: ${orderData.problem_description}`);
            doc.text(`Стоимость: ${orderData.price} ₽`);
            doc.moveDown();

            // Статус
            doc.fontSize(14)
                .font('Verdana-Bold')
                .text('Статус заказа:', { underline: true });
            let statusText = '';
            switch (orderData.status) {
                case 'pending': statusText = 'Ожидает обработки'; break;
                case 'in-progress': statusText = 'В работе'; break;
                case 'completed': statusText = 'Выполнен'; break;
                case 'cancelled': statusText = 'Отменен'; break;
                default: statusText = orderData.status;
            }
            doc.fontSize(12)
                .font('Verdana')
                .text(`Статус: ${statusText}`);
            doc.moveDown(2);

            // Гарантия (только для выполненных заказов)
            if (orderData.status === 'completed') {
                doc.fontSize(14)
                    .font('Verdana-Bold')
                    .text('ГАРАНТИЯ', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12)
                    .font('Verdana')
                    .text('На выполненные работы предоставляется гарантия 30 дней с даты выполнения заказа.');
                doc.text('В случае обнаружения недостатков в течение гарантийного срока,');
                doc.text('обращайтесь в сервисный центр с данным документом.');
                doc.moveDown(2);

                // Подписи
                doc.text('_______________              _______________');
                doc.text('  Мастер                       Клиент');
            }

            // Нижний колонтитул
            doc.moveDown(2);
            doc.fontSize(10)
                .font('Verdana')
                .text('Документ сгенерирован автоматически', { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                resolve({
                    fileName,
                    filePath,
                    downloadUrl: `/api/pdf/${fileName}`
                });
            });

            stream.on('error', (error) => {
                console.error('❌ Ошибка при записи PDF:', error);
                reject(error);
            });

        } catch (error) {
            console.error('❌ Ошибка генерации PDF:', error);
            reject(error);
        }
    });
};

// Генерация номера заказа
const generateOrderNumber = async () => {
    const year = new Date().getFullYear();
    const result = await pool.query(
        `SELECT COUNT(*) FROM orders WHERE order_number LIKE $1`,
        [`ORD-${year}-%`]
    );
    const nextNumber = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');
    return `ORD-${year}-${nextNumber}`;
};

// Функция для списания запчастей при выполнении заказа
const deductPartsForOrder = async (orderId) => {
    console.log(`🔧 Списание запчастей для заказа ${orderId}`);

    // Получаем информацию о заказе и его услуге
    const orderInfo = await pool.query(
        `SELECT o.*, s.name as service_name 
         FROM orders o
         LEFT JOIN services s ON o.service_id = s.id
         WHERE o.id = $1`,
        [orderId]
    );

    if (orderInfo.rows.length === 0) {
        console.log('❌ Заказ не найден');
        return false;
    }

    const order = orderInfo.rows[0];
    console.log(`📦 Заказ: ${order.order_number}, Услуга: ${order.service_name}`);
    console.log(`📱 Устройство: ${order.device_type} ${order.device_model || ''}`);

    // Определяем, какие запчасти нужны для данной услуги и устройства
    let partsToDeduct = [];
    const deviceType = order.device_type?.toLowerCase() || '';
    const deviceModel = order.device_model || '';

    // Логика для разных услуг
    if (order.service_id === 1) { // Ремонт телефонов
        if (deviceModel.includes('iPhone 12')) {
            partsToDeduct.push({ name: 'Экран iPhone 12', quantity: 1 });
        } else if (deviceModel.includes('iPhone 13')) {
            partsToDeduct.push({ name: 'Экран iPhone 13', quantity: 1 });
        } else if (deviceModel.includes('Samsung S21')) {
            partsToDeduct.push({ name: 'Аккумулятор Samsung S21', quantity: 1 });
        }
    }
    else if (order.service_id === 2) { // Ремонт ноутбуков
        if (deviceModel.includes('ASUS')) {
            partsToDeduct.push({ name: 'Материнская плата ASUS', quantity: 1 });
        }
        partsToDeduct.push({ name: 'Клавиатура для ноутбука', quantity: 1 });
    }
    else if (order.service_id === 3) { // Ремонт планшетов
        console.log('Для планшетов пока нет запчастей в базе');
    }
    else if (order.service_id === 4) { // Настройка ПО - не требует запчастей
        console.log('Настройка ПО - запчасти не требуются');
    }
    else if (order.service_id === 5) { // Замена аккумулятора
        if (deviceModel.includes('iPhone 12')) {
            partsToDeduct.push({ name: 'Аккумулятор iPhone 12', quantity: 1 });
        } else if (deviceModel.includes('Samsung S21')) {
            partsToDeduct.push({ name: 'Аккумулятор Samsung S21', quantity: 1 });
        }
    }
    else if (order.service_id === 6) { // Ремонт после воды
        partsToDeduct.push({ name: 'Шлейф зарядки', quantity: 1 });
        partsToDeduct.push({ name: 'Разъем зарядки Type-C', quantity: 1 });
    }

    // Списываем запчасти
    let deductedCount = 0;
    for (const part of partsToDeduct) {
        console.log(`   - Нужна запчасть: ${part.name} (${part.quantity} шт.)`);

        // Находим ID запчасти по названию
        const partInfo = await pool.query(
            `SELECT id, quantity FROM parts WHERE name ILIKE $1`,
            [`%${part.name}%`]
        );

        if (partInfo.rows.length > 0) {
            const partId = partInfo.rows[0].id;
            const currentQty = partInfo.rows[0].quantity;

            if (currentQty >= part.quantity) {
                // Списываем запчасть
                await pool.query(
                    `UPDATE parts 
                     SET quantity = quantity - $1
                     WHERE id = $2`,
                    [part.quantity, partId]
                );

                console.log(`     ✅ Списано ${part.quantity} шт. Осталось: ${currentQty - part.quantity}`);
                deductedCount++;
            } else {
                console.log(`     ⚠️ Недостаточно запчастей! Доступно: ${currentQty}, нужно: ${part.quantity}`);
            }
        } else {
            console.log(`     ❌ Запчасть "${part.name}" не найдена в базе`);
        }
    }

    console.log(`✅ Списано ${deductedCount} из ${partsToDeduct.length} запчастей`);
    return deductedCount > 0;
};

// Обновление статуса заказа с учетом архивации и списания запчастей
const updateOrderStatusWithArchive = async (orderId, status) => {
    // Получаем текущий заказ
    const orderResult = await pool.query(
        `SELECT order_number, status FROM orders WHERE id = $1`,
        [orderId]
    );

    if (orderResult.rows.length === 0) {
        return { success: false, error: 'Заказ не найден' };
    }

    const currentOrder = orderResult.rows[0];
    const oldStatus = currentOrder.status;

    // Если статус меняется на 'completed', списываем запчасти
    if (status === 'completed' && oldStatus !== 'completed') {
        console.log(`🔧 Заказ выполнен, списываем запчасти...`);
        await deductPartsForOrder(orderId);
    }

    // Обновляем статус с явным приведением в SQL
    const result = await pool.query(
        `UPDATE orders 
         SET status = $1::varchar,
             completed_at = CASE 
                 WHEN $1::varchar = 'completed' THEN CURRENT_TIMESTAMP 
                 ELSE completed_at 
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2::integer
         RETURNING *`,
        [status, orderId]
    );

    // Если статус 'completed', обновляем дату завершения в истории
    if (status === 'completed') {
        await pool.query(
            `UPDATE order_history 
             SET completion_date = CURRENT_DATE 
             WHERE order_number = $1`,
            [currentOrder.order_number]
        );
    }

    return { success: true, order: result.rows[0] };
};

// Восстановление заказа из архива
const restoreOrderFromArchive = async (orderId) => {
    const result = await pool.query(
        `UPDATE orders 
         SET status = 'pending',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status IN ('completed', 'cancelled')
         RETURNING *`,
        [orderId]
    );

    if (result.rows.length === 0) {
        return { success: false, error: 'Заказ не найден или не может быть восстановлен' };
    }

    return { success: true, order: result.rows[0] };
};

/**
 * Middleware аутентификации JWT.
 * Извлекает токен из заголовка Authorization (формат "Bearer <token>").
 * При успехе добавляет объект пользователя в req.user.
 * 
 * @async
 * @function authenticateToken
 * @param {import('express').Request} req - Объект HTTP-запроса Express
 * @param {import('express').Response} res - Объект HTTP-ответа Express
 * @param {import('express').NextFunction} next - Функция передачи управления
 * @returns {void}
 * @throws {401} Если токен не предоставлен
 * @throws {403} Если токен недействителен или просрочен
 * 
 * @example
 * app.get('/api/user/orders', authenticateToken, async (req, res) => {
 *   const userId = req.user.id; // Данные из токена
 * });
 */

// Проверка токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔍 Проверка токена:', token ? 'есть' : 'нет');

    if (!token) {
        return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('❌ Ошибка верификации токена:', err.message);
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        console.log('✅ Токен валиден, пользователь:', user.email);
        req.user = user;
        next();
    });
};

// Проверка прав администратора
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 0) {
        return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора' });
    }
    next();
};

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;

        console.log('📝 Регистрация нового пользователя:', { first_name, last_name, email, phone });

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                error: 'Заполните все обязательные поля (имя, фамилия, email, пароль)'
            });
        }

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            `SELECT * FROM create_user($1, $2, $3, $4, $5)`,
            [first_name, last_name, email, passwordHash, phone || null]
        );

        const newUser = result.rows[0];

        const token = jwt.sign(
            {
                id: newUser.id,
                email: newUser.email,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                role: newUser.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        console.log('✅ Пользователь успешно зарегистрирован:', newUser.email);

        res.status(201).json({
            message: 'Регистрация прошла успешно',
            user: newUser,
            token
        });

    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Попытка входа:', { email });

        if (!email || !password) {
            return res.status(400).json({ error: 'Заполните email и пароль' });
        }

        const result = await pool.query(
            `SELECT * FROM get_user_by_email($1)`,
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ Пользователь не найден:', email);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const user = result.rows[0];

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            console.log('❌ Неверный пароль для:', email);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        await pool.query(
            `SELECT update_user_last_visit($1)`,
            [user.id]
        );

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        delete user.password;

        console.log('✅ Успешный вход:', user.email, 'роль:', user.role);

        res.json({
            message: 'Вход выполнен успешно',
            user,
            token
        });

    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Получение текущего пользователя
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM get_user_by_id($1)`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('❌ Ошибка получения пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение всех услуг
app.get('/api/services', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM get_all_services()`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Ошибка получения услуг:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление услуги (только для админа)
app.post('/api/services', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, price } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Название и цена обязательны' });
        }

        const result = await pool.query(
            `SELECT * FROM create_service($1, $2, $3)`,
            [name, description, price]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('❌ Ошибка добавления услуги:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление услуги (только для админа)
app.put('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;

        console.log(`📝 Обновление услуги ID ${id}:`, { name, description, price });

        if (!name || !price) {
            return res.status(400).json({ error: 'Название и цена обязательны' });
        }

        // Проверяем существование услуги
        const checkService = await pool.query(
            'SELECT id FROM services WHERE id = $1',
            [id]
        );

        if (checkService.rows.length === 0) {
            return res.status(404).json({ error: 'Услуга не найдена' });
        }

        // Обновляем услугу
        const result = await pool.query(
            `UPDATE services 
             SET name = $1,
                 description = $2,
                 price = $3
             WHERE id = $4
             RETURNING *`,
            [name, description || null, price, id]
        );

        console.log('✅ Услуга обновлена:', result.rows[0]);

        res.json({
            message: 'Услуга успешно обновлена',
            service: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Ошибка обновления услуги:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении услуги' });
    }
});

// Удаление услуги (только для админа)
app.delete('/api/services/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ Удаление услуги ID ${id}`);

        // Проверяем, есть ли заказы, использующие эту услугу
        const checkOrders = await pool.query(
            'SELECT id FROM orders WHERE service_id = $1 LIMIT 1',
            [id]
        );

        if (checkOrders.rows.length > 0) {
            return res.status(400).json({
                error: 'Нельзя удалить услугу, так как она используется в заказах'
            });
        }

        // Проверяем существование услуги
        const checkService = await pool.query(
            'SELECT id FROM services WHERE id = $1',
            [id]
        );

        if (checkService.rows.length === 0) {
            return res.status(404).json({ error: 'Услуга не найдена' });
        }

        // Удаляем услугу
        await pool.query(
            'DELETE FROM services WHERE id = $1',
            [id]
        );

        console.log('✅ Услуга успешно удалена');

        res.json({
            message: 'Услуга успешно удалена'
        });

    } catch (error) {
        console.error('❌ Ошибка удаления услуги:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении услуги' });
    }
});

/**
 * Создаёт новый заказ в системе.
 * 
 * @route POST /api/orders
 * @access Private (требуется JWT)
 * @async
 * 
 * @param {import('express').Request} req - Объект запроса
 * @param {Object} req.body - Тело запроса
 * @param {number} req.body.service_id - ID услуги (обязательно)
 * @param {string} req.body.device_type - Тип устройства (обязательно)
 * @param {string} [req.body.device_model] - Модель устройства (опционально)
 * @param {string} req.body.problem_description - Описание проблемы (обязательно)
 * @param {Object} req.user - Пользователь из JWT (добавляется middleware)
 * @param {number} req.user.id - ID пользователя
 * 
 * @param {import('express').Response} res - Объект ответа
 * @returns {Promise<void>} 
 * @returns {201} Успешное создание - возвращает { message, order }
 * @returns {400} Ошибка валидации - не заполнены обязательные поля
 * @returns {404} Услуга не найдена
 * @returns {500} Внутренняя ошибка сервера
 * 
 * @example
 * /POST /api/orders
 * /Body: { "service_id": 1, "device_type": "Смартфон", "problem_description": "Не включается" }
 * /Response: { "message": "Заказ успешно создан", "order": { "id": 10, "order_number": "ORD-2026-0010" } }
 */

// Создание заказа
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { service_id, device_type, device_model, problem_description } = req.body;

        console.log('📝 Создание заказа:', {
            user_id: req.user.id,
            service_id,
            device_type,
            device_model,
            problem_description
        });

        if (!service_id || !device_type || !problem_description) {
            return res.status(400).json({
                error: 'Заполните обязательные поля: услуга, тип устройства, описание проблемы'
            });
        }

        // Проверяем, что service_id - число
        const serviceIdNum = parseInt(service_id);
        if (isNaN(serviceIdNum)) {
            return res.status(400).json({ error: 'Некорректный ID услуги' });
        }

        // Получаем цену услуги из базы данных
        const servicePrice = await pool.query(
            'SELECT price FROM services WHERE id = $1',
            [serviceIdNum]
        );

        if (servicePrice.rows.length === 0) {
            return res.status(404).json({ error: 'Услуга не найдена' });
        }

        const price = servicePrice.rows[0].price;
        console.log(`💰 Цена услуги: ${price} ₽`);

        // Создание заказа через функцию create_order с ценой
        const result = await pool.query(
            `SELECT * FROM create_order($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                serviceIdNum,
                device_type,
                device_model || null,
                problem_description,
                price
            ]
        );

        console.log('✅ Заказ создан:', result.rows[0]);

        // Формируем ответ
        let orderResponse = {};
        if (result.rows[0]) {
            orderResponse = {
                id: result.rows[0].order_id || result.rows[0].id,
                order_number: result.rows[0].order_number,
                created_at: result.rows[0].created_at,
                price: price,
                problem_description: problem_description
            };
        }

        res.status(201).json({
            message: 'Заказ успешно создан',
            order: orderResponse
        });

    } catch (error) {
        console.error('❌ Ошибка создания заказа:', error);

        let errorMessage = 'Ошибка сервера при создании заказа';
        if (error.message) {
            errorMessage += ': ' + error.message;
        }

        res.status(500).json({ error: errorMessage });
    }
});

// Получение заказов текущего пользователя
app.get('/api/user/orders', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                o.id,
                o.order_number,
                s.name AS service_name,
                o.status,
                o.device_type,
                o.device_model,
                o.problem_description,
                o.price,
                o.created_at,
                o.completed_at
            FROM orders o
            LEFT JOIN services s ON o.service_id = s.id
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        console.log(`📦 Загружено заказов для пользователя ${req.user.id}: ${result.rows.length}`);

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Ошибка получения заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение всех заказов (для админа)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM get_all_orders()`
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Ошибка получения всех заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление заказа (для админа)
app.put('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            user_id,
            service_id,
            device_type,
            device_model,
            problem_description,
            status,
            price
        } = req.body;

        console.log(`📝 Обновление заказа ID ${id}:`, req.body);

        // Проверка обязательных полей
        if (!user_id || !service_id || !device_type || !problem_description) {
            return res.status(400).json({
                error: 'Заполните все обязательные поля'
            });
        }

        // Обновляем заказ
        const result = await pool.query(
            `UPDATE orders 
             SET user_id = $1,
                 service_id = $2,
                 device_type = $3,
                 device_model = $4,
                 problem_description = $5,
                 status = $6,
                 price = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *`,
            [user_id, service_id, device_type, device_model, problem_description, status, price, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        // Получаем полную информацию о заказе с именами
        const orderInfo = await pool.query(
            `SELECT 
                o.*,
                CONCAT(u.first_name, ' ', u.last_name) AS user_name,
                u.email AS user_email,
                s.name AS service_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN services s ON o.service_id = s.id
            WHERE o.id = $1`,
            [id]
        );

        console.log('✅ Заказ обновлен:', orderInfo.rows[0]);

        res.json({
            message: 'Заказ успешно обновлен',
            order: orderInfo.rows[0]
        });

    } catch (error) {
        console.error('❌ Ошибка обновления заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении заказа' });
    }
});

// Удаление заказа (для админа)
app.delete('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ Удаление заказа ID ${id}`);

        // Проверяем существование заказа
        const checkOrder = await pool.query(
            'SELECT id FROM orders WHERE id = $1',
            [id]
        );

        if (checkOrder.rows.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        // Удаляем связанные записи в order_history
        await pool.query(
            'DELETE FROM order_history WHERE order_number = (SELECT order_number FROM orders WHERE id = $1)',
            [id]
        );

        // Удаляем заказ
        await pool.query(
            'DELETE FROM orders WHERE id = $1',
            [id]
        );

        console.log('✅ Заказ успешно удален');

        res.json({
            message: 'Заказ успешно удален'
        });

    } catch (error) {
        console.error('❌ Ошибка удаления заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении заказа' });
    }
});

// Обновление статуса заказа
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Проверка статуса
        const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Некорректный статус' });
        }

        // Обновление статуса через функцию
        const result = await updateOrderStatusWithArchive(parseInt(id), status);

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json({
            message: 'Статус заказа обновлен',
            order: result.order
        });

    } catch (error) {
        console.error('❌ Ошибка обновления статуса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Восстановление заказа из архива
app.put('/api/orders/:id/restore', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await restoreOrderFromArchive(parseInt(id));

        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json({
            message: 'Заказ восстановлен из архива',
            order: result.order
        });

    } catch (error) {
        console.error('❌ Ошибка восстановления заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение активных заказов
app.get('/api/orders/active', authenticateToken, async (req, res) => {
    try {
        let result;

        if (req.user.role === 0 || req.user.role === 1) {
            result = await pool.query(
                `SELECT 
                    o.id,
                    o.order_number,
                    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
                    u.email AS user_email,
                    s.name AS service_name,
                    o.status,
                    o.device_type,
                    o.device_model,
                    o.problem_description,
                    o.price,
                    o.created_at,
                    o.completed_at
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN services s ON o.service_id = s.id
                WHERE o.status NOT IN ('completed', 'cancelled')
                ORDER BY o.created_at DESC`
            );
        } else {
            result = await pool.query(
                `SELECT 
                    o.id,
                    o.order_number,
                    s.name AS service_name,
                    o.status,
                    o.device_type,
                    o.device_model,
                    o.problem_description,
                    o.price,
                    o.created_at,
                    o.completed_at
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.id
                WHERE o.user_id = $1 AND o.status NOT IN ('completed', 'cancelled')
                ORDER BY o.created_at DESC`,
                [req.user.id]
            );
        }

        res.json(result.rows);
    } catch (error) {
        console.error('❌ Ошибка получения активных заказов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение PDF для заказа
app.get('/api/orders/:id/pdf', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const orderInfo = await pool.query(
            `SELECT 
                o.*,
                CONCAT(u.first_name, ' ', u.last_name) AS user_name,
                u.email AS user_email,
                s.name AS service_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN services s ON o.service_id = s.id
            WHERE o.id = $1`,
            [id]
        );

        if (orderInfo.rows.length === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        const pdfInfo = await generateOrderPDF(orderInfo.rows[0]);
        res.download(pdfInfo.filePath);

    } catch (error) {
        console.error('❌ Ошибка генерации PDF:', error);
        res.status(500).json({ error: 'Ошибка при генерации PDF' });
    }
});

// Архив заказов
app.get('/api/orders/archive', authenticateToken, async (req, res) => {
    try {
        let result;

        if (req.user.role === 0 || req.user.role === 1) {
            result = await pool.query(
                `SELECT 
                    o.id,
                    o.order_number,
                    CONCAT(u.first_name, ' ', u.last_name) AS user_name,
                    u.email AS user_email,
                    s.name AS service_name,
                    o.status,
                    o.device_type,
                    o.device_model,
                    o.problem_description,
                    o.price,
                    o.created_at,
                    o.completed_at
                FROM orders o
                LEFT JOIN users u ON o.user_id = u.id
                LEFT JOIN services s ON o.service_id = s.id
                WHERE o.status IN ('completed', 'cancelled')
                ORDER BY 
                    CASE 
                        WHEN o.status = 'completed' AND o.completed_at IS NOT NULL THEN o.completed_at
                        ELSE o.created_at
                    END DESC`
            );
        } else {
            result = await pool.query(
                `SELECT 
                    o.id,
                    o.order_number,
                    s.name AS service_name,
                    o.status,
                    o.device_type,
                    o.device_model,
                    o.problem_description,
                    o.price,
                    o.created_at,
                    o.completed_at
                FROM orders o
                LEFT JOIN services s ON o.service_id = s.id
                WHERE o.user_id = $1 AND o.status IN ('completed', 'cancelled')
                ORDER BY 
                    CASE 
                        WHEN o.status = 'completed' AND o.completed_at IS NOT NULL THEN o.completed_at
                        ELSE o.created_at
                    END DESC`,
                [req.user.id]
            );
        }

        console.log(`📦 Загружено архивированных заказов: ${result.rows.length}`);
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Ошибка получения архива:', error);
        res.status(500).json({ error: 'Ошибка сервера при загрузке архива' });
    }
});

// Поиск заказа по номеру
app.get('/api/orders/search/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;

        console.log('🔍 Публичный поиск заказа:', orderNumber);

        const result = await pool.query(
            `SELECT 
                o.id,
                o.order_number,
                CONCAT(u.first_name, ' ', u.last_name) AS user_name,
                u.email AS user_email,
                s.name AS service_name,
                o.status,
                o.device_type,
                o.device_model,
                o.problem_description,
                o.price,
                o.created_at,
                o.completed_at
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN services s ON o.service_id = s.id
            WHERE o.order_number = $1`,
            [orderNumber]
        );

        if (result.rows.length === 0) {
            console.log('❌ Заказ не найден:', orderNumber);
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        console.log('✅ Заказ найден:', result.rows[0].order_number);
        res.json(result.rows[0]);

    } catch (error) {
        console.error('❌ Ошибка при поиске заказа:', error);
        res.status(500).json({ error: 'Ошибка сервера при поиске заказа' });
    }
});

// Поиск заказов по email
app.post('/api/orders/search-by-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        console.log('🔍 Поиск заказов по email:', email);

        const result = await pool.query(
            `SELECT 
                o.id,
                o.order_number,
                s.name AS service_name,
                o.status,
                o.device_type,
                o.device_model,
                o.problem_description,
                o.price,
                o.created_at,
                o.completed_at
            FROM orders o
            LEFT JOIN services s ON o.service_id = s.id
            LEFT JOIN users u ON o.user_id = u.id
            WHERE u.email = $1
            ORDER BY o.created_at DESC`,
            [email]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('❌ Ошибка при поиске заказов по email:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение всех запчастей
app.get('/api/parts', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM get_all_parts()`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Ошибка получения запчастей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление запчасти (только для админа)
app.post('/api/parts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, quantity, price } = req.body;

        if (!name || !price) {
            return res.status(400).json({ error: 'Название и цена обязательны' });
        }

        const result = await pool.query(
            `SELECT * FROM create_part($1, $2, $3, $4)`,
            [name, description, quantity || 0, price]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('❌ Ошибка добавления запчасти:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление количества запчастей (только для админа)
app.put('/api/parts/:id/quantity', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        console.log(`🔧 Обновление количества запчасти ID ${id} на ${quantity}`);

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ error: 'Количество должно быть положительным числом' });
        }

        const result = await pool.query(
            `UPDATE parts 
             SET quantity = $1
             WHERE id = $2 
             RETURNING *`,
            [quantity, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Запчасть не найдена' });
        }

        console.log('✅ Количество обновлено:', result.rows[0]);

        res.json({
            message: 'Количество запчастей обновлено',
            part: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Ошибка обновления количества:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление запчасти (только для админа)
app.put('/api/parts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, quantity, price } = req.body;

        console.log(`📝 Обновление запчасти ID ${id}:`, { name, description, quantity, price });

        if (!name || !price || quantity === undefined) {
            return res.status(400).json({ error: 'Название, количество и цена обязательны' });
        }

        if (quantity < 0) {
            return res.status(400).json({ error: 'Количество не может быть отрицательным' });
        }

        if (price < 0) {
            return res.status(400).json({ error: 'Цена не может быть отрицательной' });
        }

        // Проверяем существование запчасти
        const checkPart = await pool.query(
            'SELECT id FROM parts WHERE id = $1',
            [id]
        );

        if (checkPart.rows.length === 0) {
            return res.status(404).json({ error: 'Запчасть не найдена' });
        }

        // Обновляем запчасть
        const result = await pool.query(
            `UPDATE parts 
             SET name = $1,
                 description = $2,
                 quantity = $3,
                 price = $4
             WHERE id = $5
             RETURNING *`,
            [name, description || null, quantity, price, id]
        );

        console.log('✅ Запчасть обновлена:', result.rows[0]);

        res.json({
            message: 'Запчасть успешно обновлена',
            part: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Ошибка обновления запчасти:', error);
        res.status(500).json({ error: 'Ошибка сервера при обновлении запчасти' });
    }
});

// Удаление запчасти (только для админа)
app.delete('/api/parts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ Удаление запчасти ID ${id}`);

        // Проверяем существование запчасти
        const checkPart = await pool.query(
            'SELECT id FROM parts WHERE id = $1',
            [id]
        );

        if (checkPart.rows.length === 0) {
            return res.status(404).json({ error: 'Запчасть не найдена' });
        }

        // Удаляем запчасть
        await pool.query(
            'DELETE FROM parts WHERE id = $1',
            [id]
        );

        console.log('✅ Запчасть успешно удалена');

        res.json({
            message: 'Запчасть успешно удалена'
        });

    } catch (error) {
        console.error('❌ Ошибка удаления запчасти:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении запчасти' });
    }
});

// Получение всех пользователей
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM get_all_users()`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Ошибка получения пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создание пользователя (только для админа)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone, role } = req.body;

        console.log('📝 Создание нового пользователя администратором:', {
            first_name,
            last_name,
            email,
            phone,
            role
        });

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                error: 'Заполните все обязательные поля (имя, фамилия, email, пароль)'
            });
        }

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            `SELECT * FROM create_user($1, $2, $3, $4, $5)`,
            [first_name, last_name, email, passwordHash, phone || null]
        );

        const newUser = result.rows[0];

        if (role !== undefined && role !== 2) {
            await pool.query(
                'UPDATE users SET role = $1 WHERE id = $2',
                [role, newUser.id]
            );
            newUser.role = role;
        }

        console.log('✅ Пользователь успешно создан администратором:', newUser.email);

        res.status(201).json({
            message: 'Пользователь успешно создан',
            user: newUser
        });

    } catch (error) {
        console.error('❌ Ошибка при создании пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера при создании пользователя' });
    }
});

// Обновление пользователя (только для админа)
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, phone } = req.body;

        const result = await pool.query(
            `SELECT update_user($1, $2, $3, $4)`,
            [id, first_name, last_name, phone]
        );

        if (!result.rows[0].update_user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const updatedUser = await pool.query(
            `SELECT * FROM get_user_by_id($1)`,
            [id]
        );

        res.json({
            message: 'Пользователь обновлен',
            user: updatedUser.rows[0]
        });

    } catch (error) {
        console.error('❌ Ошибка обновления пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Изменение роли пользователя (только для админа)
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        console.log('🔄 Изменение роли пользователя:', { id, role });

        if (![0, 1, 2].includes(role)) {
            return res.status(400).json({ error: 'Некорректная роль' });
        }

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Вы не можете изменить свою собственную роль' });
        }

        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, role',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        console.log('✅ Роль пользователя обновлена:', result.rows[0]);
        res.json({
            message: 'Роль пользователя обновлена',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Ошибка при изменении роли:', error);
        res.status(500).json({ error: 'Ошибка сервера при изменении роли' });
    }
});

// Удаление пользователя (только для админа)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ Попытка удаления пользователя с ID:', id);

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Вы не можете удалить свой собственный аккаунт' });
        }

        const result = await pool.query(
            'SELECT delete_user($1) as success',
            [id]
        );

        console.log('✅ Пользователь успешно удален');
        res.json({
            message: 'Пользователь успешно удален'
        });

    } catch (error) {
        console.error('❌ Ошибка при удалении пользователя:', error);

        if (error.message.includes('Нельзя удалить пользователя с существующими заказами')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Ошибка сервера при удалении пользователя' });
    }
});

// Поиск пользователей
app.get('/api/admin/users/search/:term', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { term } = req.params;
        const result = await pool.query(
            `SELECT * FROM search_users($1)`,
            [term]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('❌ Ошибка поиска пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение статистики
app.get('/api/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM get_order_statistics()`
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('❌ Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Скачивание PDF файла
app.get('/api/pdf/:fileName', async (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(pdfDir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Файл не найден' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('❌ Ошибка при скачивании PDF:', error);
        res.status(500).json({ error: 'Ошибка при скачивании файла' });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 API доступно по адресу: http://localhost:${PORT}/api`);
    console.log(`=================================`);
});
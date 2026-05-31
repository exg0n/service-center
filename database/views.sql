-- 1. Представление активных заказов (pending и in-progress)
CREATE VIEW active_orders_view AS
SELECT 
    o.id,
    o.order_number,
    CONCAT(u.first_name, ' ', u.last_name) AS client_name,
    u.phone AS client_phone,
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
WHERE o.status IN ('pending', 'in-progress')
ORDER BY o.created_at DESC;

-- 2. Представление завершенных заказов
CREATE VIEW completed_orders_view AS
SELECT 
    o.id,
    o.order_number,
    CONCAT(u.first_name, ' ', u.last_name) AS client_name,
    u.phone AS client_phone,
    s.name AS service_name,
    o.price,
    o.created_at,
    o.completed_at,
    (o.completed_at - o.created_at) AS days_in_work
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN services s ON o.service_id = s.id
WHERE o.status = 'completed'
ORDER BY o.completed_at DESC;

-- 3. Представление заказов текущего пользователя (для user/orders)
CREATE VIEW user_orders_view AS
SELECT 
    o.id,
    o.order_number,
    o.user_id,
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
ORDER BY o.created_at DESC;

-- 4. Представление статистики по услугам
CREATE VIEW service_stats_view AS
SELECT 
    s.id,
    s.name AS service_name,
    s.description,
    s.price AS base_price,
    COUNT(o.id) AS total_orders,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.status = 'in-progress' THEN 1 END) AS in_progress_orders,
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.price END), 0) AS total_revenue
FROM services s
LEFT JOIN orders o ON s.id = o.service_id
GROUP BY s.id, s.name, s.description, s.price
ORDER BY total_orders DESC;

-- 5. Представление истории заказов с деталями
CREATE VIEW order_history_view AS
SELECT 
    o.id,
    o.order_number,
    CONCAT(u.first_name, ' ', u.last_name) AS client_name,
    u.email AS client_email,
    s.name AS service_name,
    o.status,
    o.price,
    o.created_at,
    o.completed_at,
    oh.application_date,
    oh.completion_date AS history_completion_date,
    CASE 
        WHEN o.status = 'completed' THEN 'Завершен'
        WHEN o.status = 'cancelled' THEN 'Отменен'
        WHEN o.status = 'pending' THEN 'Ожидает'
        WHEN o.status = 'in-progress' THEN 'В работе'
        ELSE 'Неизвестно'
    END AS status_display
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN services s ON o.service_id = s.id
LEFT JOIN order_history oh ON o.order_number = oh.order_number
ORDER BY o.created_at DESC;

-- 6. Представление статистики по пользователям
CREATE VIEW user_statistics_view AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.email,
    u.role,
    u.phone,
    u.last_visit,
    COUNT(o.id) AS total_orders,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END) AS pending_orders,
    COUNT(CASE WHEN o.status = 'in-progress' THEN 1 END) AS in_progress_orders,
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.price END), 0) AS total_spent,
    MAX(o.created_at) AS last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.phone, u.last_visit
ORDER BY total_orders DESC;

-- 7. Представление финансовой статистики по месяцам
CREATE VIEW financial_stats_view AS
SELECT 
    DATE_TRUNC('month', created_at)::DATE AS month,
    TO_CHAR(created_at, 'YYYY-MM') AS month_year,
    COUNT(*) AS total_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_orders,
    COALESCE(SUM(CASE WHEN status = 'completed' THEN price END), 0) AS revenue,
    COALESCE(AVG(CASE WHEN status = 'completed' THEN price END), 0) AS avg_order_value,
    COALESCE(MAX(CASE WHEN status = 'completed' THEN price END), 0) AS max_order_value,
    COALESCE(MIN(CASE WHEN status = 'completed' THEN price END), 0) AS min_order_value
FROM orders
GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- 8. Представление статуса склада (запчасти)
CREATE VIEW stock_status_view AS
SELECT 
    id,
    name,
    description,
    quantity,
    price,
    CASE 
        WHEN quantity <= 0 THEN 'Нет в наличии'
        WHEN quantity <= 5 THEN 'Мало (менее 5)'
        WHEN quantity <= 10 THEN 'Средне (менее 10)'
        ELSE 'Достаточно'
    END AS stock_status,
    CASE 
        WHEN quantity <= 5 THEN TRUE
        ELSE FALSE
    END AS needs_reorder
FROM parts
ORDER BY quantity, name;

-- 9. Представление ожидающих заказов (pending)
CREATE VIEW pending_orders_view AS
SELECT 
    o.id,
    o.order_number,
    CONCAT(u.first_name, ' ', u.last_name) AS client_name,
    u.phone AS client_phone,
    s.name AS service_name,
    o.device_type,
    o.device_model,
    o.problem_description,
    o.price,
    o.created_at,
    (CURRENT_DATE - o.created_at) AS days_waiting
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN services s ON o.service_id = s.id
WHERE o.status = 'pending'
ORDER BY o.created_at;

-- 10. Представление для админ-панели (все заказы с пользователями)
CREATE VIEW admin_orders_view AS
SELECT 
    o.id,
    o.order_number,
    u.first_name AS user_first_name,
    u.last_name AS user_last_name,
    CONCAT(u.first_name, ' ', u.last_name) AS user_full_name,
    u.email AS user_email,
    u.phone AS user_phone,
    s.name AS service_name,
    o.status,
    o.device_type,
    o.device_model,
    o.problem_description,
    o.price,
    o.created_at,
    o.completed_at,
    CASE 
        WHEN o.status = 'completed' THEN 'Завершен'
        WHEN o.status = 'cancelled' THEN 'Отменен'
        WHEN o.status = 'pending' THEN 'Ожидает'
        WHEN o.status = 'in-progress' THEN 'В работе'
    END AS status_display
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN services s ON o.service_id = s.id
ORDER BY o.created_at DESC;
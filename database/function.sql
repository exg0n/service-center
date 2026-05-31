-- 1. Функция для генерации номера заказа
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    year_prefix TEXT;
    next_number INTEGER;
    result TEXT;
BEGIN
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_prefix || '-%';
    
    result := 'ORD-' || year_prefix || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Функция для проверки статуса заказа
CREATE OR REPLACE FUNCTION check_order_status(p_order_id INTEGER)
RETURNS TABLE(
    status VARCHAR,
    order_number VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT o.status, o.order_number
    FROM orders o
    WHERE o.id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Функция для обновления статуса заказа и даты завершения
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id INTEGER,
    p_status VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_order_number VARCHAR;
BEGIN
    -- Получаем номер заказа
    SELECT order_number INTO v_order_number
    FROM orders
    WHERE id = p_order_id;
    
    -- Обновляем статус
    UPDATE orders 
    SET status = p_status,
        completed_at = CASE 
            WHEN p_status = 'completed' THEN CURRENT_DATE 
            ELSE completed_at 
        END
    WHERE id = p_order_id;
    
    -- Если статус 'completed', обновляем дату завершения в истории
    IF p_status = 'completed' THEN
        UPDATE order_history 
        SET completion_date = CURRENT_DATE 
        WHERE order_number = v_order_number;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 4. Функция для получения заказов пользователя
CREATE OR REPLACE FUNCTION get_user_orders(p_user_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    order_number VARCHAR,
    service_name VARCHAR,
    status VARCHAR,
    price DECIMAL,
    created_at DATE,
    completed_at DATE,
    device_type VARCHAR,
    device_model VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        s.name,
        o.status,
        o.price,
        o.created_at,
        o.completed_at,
        o.device_type,
        o.device_model
    FROM orders o
    LEFT JOIN services s ON o.service_id = s.id
    WHERE o.user_id = p_user_id
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Функция для получения всех заказов (для админа)
CREATE OR REPLACE FUNCTION get_all_orders()
RETURNS TABLE(
    id INTEGER,
    order_number VARCHAR,
    user_name TEXT,
    user_email VARCHAR,
    service_name VARCHAR,
    status VARCHAR,
    device_type VARCHAR,
    device_model VARCHAR,
    problem_description TEXT,
    price DECIMAL,
    created_at DATE,
    completed_at DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        u.email,
        s.name,
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
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Функция для создания нового заказа (обновляет last_visit пользователя)
CREATE OR REPLACE FUNCTION create_order(
    p_user_id INTEGER,
    p_service_id INTEGER,
    p_device_type VARCHAR,
    p_device_model VARCHAR,
    p_problem_description TEXT,
    p_price DECIMAL
) RETURNS TABLE(
    id INTEGER,
    order_number VARCHAR,
    created_at DATE
) AS $$
DECLARE
    v_order_number VARCHAR;
BEGIN
    -- Генерируем номер заказа
    v_order_number := generate_order_number();
    
    -- Создаем заказ
    INSERT INTO orders (
        order_number, user_id, service_id, device_type, 
        device_model, problem_description, price, created_at
    ) VALUES (
        v_order_number, p_user_id, p_service_id, p_device_type,
        p_device_model, p_problem_description, p_price, CURRENT_DATE
    ) RETURNING id, order_number, created_at INTO id, order_number, created_at;
    
    -- Добавляем в историю
    INSERT INTO order_history (order_number, application_date)
    VALUES (v_order_number, CURRENT_DATE);
    
    -- ОБНОВЛЯЕМ ДАТУ ПОСЛЕДНЕГО ОБРАЩЕНИЯ ПОЛЬЗОВАТЕЛЯ
    UPDATE users 
    SET last_visit = CURRENT_DATE 
    WHERE id = p_user_id;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 7. Функция для проверки существования пользователя по email
CREATE OR REPLACE FUNCTION check_user_exists(p_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE email = p_email) INTO user_exists;
    RETURN user_exists;
END;
$$ LANGUAGE plpgsql;

-- 8. Функция для получения пользователя по email (с паролем для авторизации)
CREATE OR REPLACE FUNCTION get_user_by_email(p_email VARCHAR)
RETURNS TABLE(
    id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    password VARCHAR,
    role INTEGER,
    phone VARCHAR,
    last_visit DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.first_name, u.last_name, u.email, u.password, u.role, u.phone, u.last_visit
    FROM users u
    WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql;

-- 9. Функция для получения пользователя по ID (без пароля)
CREATE OR REPLACE FUNCTION get_user_by_id(p_user_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    role INTEGER,
    phone VARCHAR,
    last_visit DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.phone, u.last_visit
    FROM users u
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Функция для создания нового пользователя (регистрация)
CREATE OR REPLACE FUNCTION create_user(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_email VARCHAR,
    p_password_hash VARCHAR,
    p_phone VARCHAR DEFAULT NULL
) RETURNS TABLE(
    id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    role INTEGER,
    phone VARCHAR,
    last_visit DATE
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO users (first_name, last_name, email, password, role, phone, last_visit)
    VALUES (p_first_name, p_last_name, p_email, p_password_hash, 2, p_phone, NULL)
    RETURNING users.id, users.first_name, users.last_name, users.email, users.role, users.phone, users.last_visit;
END;
$$ LANGUAGE plpgsql;

-- 11. Функция для обновления даты последнего визита
CREATE OR REPLACE FUNCTION update_user_last_visit(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET last_visit = CURRENT_DATE 
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 12. Функция для получения всех пользователей (для админа)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(
    id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    full_name TEXT,
    email VARCHAR,
    role INTEGER,
    phone VARCHAR,
    last_visit DATE,
    total_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.role,
        u.phone,
        u.last_visit,
        COUNT(o.id)::BIGINT as total_orders
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, u.phone, u.last_visit
    ORDER BY u.id;
END;
$$ LANGUAGE plpgsql;

-- 13. Функция для обновления данных пользователя
CREATE OR REPLACE FUNCTION update_user(
    p_user_id INTEGER,
    p_first_name VARCHAR DEFAULT NULL,
    p_last_name VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        phone = COALESCE(p_phone, phone)
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 14. Функция для поиска пользователей по имени/фамилии
CREATE OR REPLACE FUNCTION search_users(
    p_search_term VARCHAR
) RETURNS TABLE(
    id INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    full_name TEXT,
    email VARCHAR,
    phone VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone
    FROM users u
    WHERE 
        u.first_name ILIKE '%' || p_search_term || '%' OR
        u.last_name ILIKE '%' || p_search_term || '%' OR
        CONCAT(u.first_name, ' ', u.last_name) ILIKE '%' || p_search_term || '%'
    ORDER BY u.last_name, u.first_name;
END;
$$ LANGUAGE plpgsql;

-- 15. Функция для получения всех услуг
CREATE OR REPLACE FUNCTION get_all_services()
RETURNS TABLE(
    id INTEGER,
    name VARCHAR,
    description TEXT,
    price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.description, s.price
    FROM services s
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- 16. Функция для проверки существования услуги
CREATE OR REPLACE FUNCTION check_service_exists(p_service_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    service_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM services WHERE id = p_service_id) INTO service_exists;
    RETURN service_exists;
END;
$$ LANGUAGE plpgsql;

-- 17. Функция для добавления новой услуги (для админа)
CREATE OR REPLACE FUNCTION create_service(
    p_name VARCHAR,
    p_description TEXT,
    p_price DECIMAL
) RETURNS TABLE(
    id INTEGER,
    name VARCHAR,
    description TEXT,
    price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO services (name, description, price)
    VALUES (p_name, p_description, p_price)
    RETURNING services.id, services.name, services.description, services.price;
END;
$$ LANGUAGE plpgsql;

-- 18. Функция для получения всех запчастей
CREATE OR REPLACE FUNCTION get_all_parts()
RETURNS TABLE(
    id INTEGER,
    name VARCHAR,
    description TEXT,
    quantity INTEGER,
    price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.description, p.quantity, p.price
    FROM parts p
    ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- 19. Функция для добавления новой запчасти (для админа)
CREATE OR REPLACE FUNCTION create_part(
    p_name VARCHAR,
    p_description TEXT,
    p_quantity INTEGER,
    p_price DECIMAL
) RETURNS TABLE(
    id INTEGER,
    name VARCHAR,
    description TEXT,
    quantity INTEGER,
    price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO parts (name, description, quantity, price)
    VALUES (p_name, p_description, p_quantity, p_price)
    RETURNING parts.id, parts.name, parts.description, parts.quantity, parts.price;
END;
$$ LANGUAGE plpgsql;

-- 20. Функция для обновления количества запчастей
CREATE OR REPLACE FUNCTION update_part_quantity(
    p_part_id INTEGER,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE parts 
    SET quantity = p_quantity 
    WHERE id = p_part_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 21. Функция для проверки наличия запчастей
CREATE OR REPLACE FUNCTION check_part_availability(
    p_part_id INTEGER,
    p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_available BOOLEAN;
    v_current_qty INTEGER;
BEGIN
    SELECT quantity INTO v_current_qty
    FROM parts
    WHERE id = p_part_id;
    
    v_available := (v_current_qty >= p_quantity);
    
    RETURN v_available;
END;
$$ LANGUAGE plpgsql;

-- 22. Функция для получения статистики по заказам
CREATE OR REPLACE FUNCTION get_order_statistics()
RETURNS TABLE(
    total_orders BIGINT,
    pending_orders BIGINT,
    in_progress_orders BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::BIGINT,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::BIGINT,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN price END), 0)
    FROM orders;
END;
$$ LANGUAGE plpgsql;

-- 23. Функция для проверки валидности статуса заказа
CREATE OR REPLACE FUNCTION is_valid_order_status(p_status VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_status IN ('pending', 'in-progress', 'completed', 'cancelled');
END;
$$ LANGUAGE plpgsql;

-- 24. Функция для удаления пользователя (только если нет заказов)
CREATE OR REPLACE FUNCTION delete_user(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    orders_count INTEGER;
BEGIN
    -- Проверяем, есть ли у пользователя заказы
    SELECT COUNT(*) INTO orders_count
    FROM orders
    WHERE user_id = p_user_id;

    IF orders_count > 0 THEN
        RAISE EXCEPTION 'Нельзя удалить пользователя с существующими заказами. У пользователя % заказ(ов)', orders_count;
    END IF;

    -- Удаляем пользователя
    DELETE FROM users WHERE id = p_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
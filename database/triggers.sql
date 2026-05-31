-- 1. Функция для триггера: автоматическое обновление даты завершения заказа
CREATE OR REPLACE FUNCTION trigger_update_completion_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        NEW.completed_at := CURRENT_DATE;
        
        -- Обновляем дату завершения в истории заказов
        UPDATE order_history 
        SET completion_date = CURRENT_DATE 
        WHERE order_number = NEW.order_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Функция для триггера: автоматическое добавление заказа в историю
CREATE OR REPLACE FUNCTION trigger_add_to_order_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO order_history (order_number, application_date)
    VALUES (NEW.order_number, NEW.created_at);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Функция для триггера: автоматическое обновление last_visit
CREATE OR REPLACE FUNCTION trigger_update_last_visit()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_visit := CURRENT_DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Функция для триггера: проверка статуса перед обновлением
CREATE OR REPLACE FUNCTION trigger_check_order_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT (NEW.status IN ('pending', 'in-progress', 'completed', 'cancelled')) THEN
        RAISE EXCEPTION 'Некорректный статус заказа: %', NEW.status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Функция для триггера: автоматическая установка created_at при создании
CREATE OR REPLACE FUNCTION trigger_set_created_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_at IS NULL THEN
        NEW.created_at := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Функция для триггера: проверка существования пользователя при создании заказа
CREATE OR REPLACE FUNCTION trigger_check_user_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
        RAISE EXCEPTION 'Пользователь с ID % не существует', NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Функция для триггера: проверка существования услуги при создании заказа
CREATE OR REPLACE FUNCTION trigger_check_service_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = NEW.service_id) THEN
        RAISE EXCEPTION 'Услуга с ID % не существует', NEW.service_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Функция для триггера: предотвращение удаления пользователя с заказами
CREATE OR REPLACE FUNCTION trigger_prevent_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM orders WHERE user_id = OLD.id) THEN
        RAISE EXCEPTION 'Нельзя удалить пользователя с существующими заказами';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 9. Функция для триггера: логирование изменений статуса заказа
CREATE OR REPLACE FUNCTION trigger_log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_log (order_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Триггер для автоматического обновления даты завершения заказа
CREATE TRIGGER trg_update_completion_date
    BEFORE UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_completion_date();

-- 2. Триггер для автоматического добавления заказа в историю
CREATE TRIGGER trg_add_to_order_history
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_add_to_order_history();

-- 3. Триггер для автоматического обновления last_visit
CREATE TRIGGER trg_update_last_visit
    BEFORE UPDATE OF last_visit ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_last_visit();

-- 4. Триггер для проверки статуса перед обновлением
CREATE TRIGGER trg_check_order_status
    BEFORE INSERT OR UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_order_status();

-- 5. Триггер для автоматической установки created_at
CREATE TRIGGER trg_set_created_at
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_created_at();

-- 6. Триггер для проверки существования пользователя
CREATE TRIGGER trg_check_user_exists
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_user_exists();

-- 7. Триггер для проверки существования услуги
CREATE TRIGGER trg_check_service_exists
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_service_exists();

-- 8. Триггер для предотвращения удаления пользователя с заказами
CREATE TRIGGER trg_prevent_user_deletion
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_prevent_user_deletion();

-- 9. Триггер для логирования изменений статуса
CREATE TRIGGER trg_log_status_change
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_status_change();
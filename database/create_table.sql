-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role INTEGER DEFAULT 2 CHECK (role IN (0, 1, 2)),
    phone VARCHAR(20),
    last_visit DATE
);

-- Таблица услуг
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL
);

-- Таблица запчастей
CREATE TABLE parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    price DECIMAL(10, 2) NOT NULL
);

-- Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
    device_type VARCHAR(100) NOT NULL,
    device_model VARCHAR(100),
    problem_description TEXT NOT NULL,
    price DECIMAL(10, 2),
    created_at DATE DEFAULT CURRENT_DATE,
    completed_at DATE
);

-- Таблица истории заказов
CREATE TABLE order_history (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) REFERENCES orders(order_number) ON DELETE CASCADE,
    application_date DATE NOT NULL,
    completion_date DATE
);

-- Таблица логов изменений статусов
CREATE TABLE order_status_log (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
/**
 * Настройка тестового окружения для Jest
 * Выполняется перед запуском всех тестов
 */

// Увеличиваем таймаут для долгих тестов
jest.setTimeout(10000);

// Глобальные моки
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Очистка между тестами
beforeEach(() => {
    jest.clearAllMocks();
});

// Функция для создания тестовых данных
global.createMockOrder = (overrides = {}) => ({
    id: 1,
    order_number: 'ORD-2026-0001',
    status: 'pending',
    device_type: 'Смартфон',
    device_model: 'iPhone 12',
    problem_description: 'Тестовая проблема',
    price: 1500,
    created_at: new Date().toISOString(),
    user_name: 'Тестовый Пользователь',
    ...overrides
});

global.createMockUser = (overrides = {}) => ({
    id: 1,
    first_name: 'Тест',
    last_name: 'Пользователь',
    email: 'test@example.com',
    role: 2,
    phone: '+7 (999) 123-45-67',
    ...overrides
});
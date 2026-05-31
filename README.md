## Информационная система «Сервисный центр»

Веб-приложение для автоматизации деятельности сервисного центра по ремонту цифровой техники.

---

## Системные требования

| Компонент                 | Требование                                    |
| ------------------------- | --------------------------------------------- |
| **Операционная система**  | Windows 10/11, Ubuntu 20.04+, macOS           |
| **Node.js**               | версия 18+                                    |
| Vue.js                    | версия 3+                                     |
| **PostgreSQL**            | версия 14+                                    |
| **Браузер**               | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **ОЗУ**                   | от 2 ГБ (рекомендуется 4 ГБ)                  |
| **Дисковое пространство** | от 500 МБ                                     |

---

### Шаг 1: Установка Node.js

Скачайте и установите Node.js 18+ c официального сайта: https://nodejs.org/

Проверьте установку:
```cmd
node --version
npm --version
```

### Шаг 2: Установка PostgreSQL

Скачайте и установите PostgreSQL 14+ с официального сайта: https://www.postgresql.org/download/

| Имя пользователя | postgres                        |
| ---------------- | ------------------------------- |
| Пароль           | который вы задали при установке |
| Порт             | 5432                            |
### Шаг 3: Клонирование репозитория

```cmd
git clone https://github.com/exg0n/service-center
cd service-center
```

### Шаг 4: Настройка базы данных

Подключитесь к PostgreSQL и создайте базу данных:
```sql
CREATE DATABASE service_center;
```

Выполните SQL-скрипты (файлы в корне проекта):
```cmd
psql -U postgres -d service_center -f create_table.sql
psql -U postgres -d service_center -f function.sql
psql -U postgres -d service_center -f triggers.sql
psql -U postgres -d service_center -f views.sql
psql -U postgres -d service_center -f filling_tables.sql
```

### Шаг 5: Настройка серверной части

Создайте файл `.env` в папке `backend` и заполните его следующим образом
```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=service_center
DB_PASSWORD= <your_password_here>
DB_PORT=5432
JWT_SECRET= <your_secret_key_minimum_32_characters>
JWT_EXPIRES_IN=24h
```

Переменные окружения

|Переменная|Описание|Пример|
|---|---|---|
|`PORT`|Порт сервера|`3000`|
|`DB_USER`|Пользователь PostgreSQL|`postgres`|
|`DB_HOST`|Хост базы данных|`localhost`|
|`DB_NAME`|Имя базы данных|`service_center`|
|`DB_PASSWORD`|Пароль PostgreSQL|`mypassword`|
|`DB_PORT`|Порт PostgreSQL|`5432`|
|`JWT_SECRET`|Секретный ключ JWT|`supersecretkey123`|
|`JWT_EXPIRES_IN`|Время жизни токена|`24h`|

### Шаг 6: Установка зависимостей

Установите зависимости для клиентской части
```cmd
cd service-center
npm install
```

Установите зависимости для серверной части
```cmd
cd backend
npm install
```
### Шаг 7: Запуск пользовательского интерфейса и серверной части

Запуск клиентской части
```cmd
cd service-center
npm run dev
```

Запуск серверной части в новом терминале
```cmd
cd backend
npm run dev
```

### Шаг 8: Работа с системой

Откройте любой современный веб-браузер и введите в поисковую строку
```url
http://localhost:5173
```

Система готова к использованию

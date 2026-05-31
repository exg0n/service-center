import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomePage
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('../components/LoginPage.vue')
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('../components/RegisterPage.vue')
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => import('../components/ProfilePage.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'admin',
        component: () => import('../components/AdminPage.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/manager',
        name: 'manager',
        component: () => import('../components/AdminPage.vue'), // Можно создать отдельную страницу для менеджера
        meta: { requiresAuth: true, requiresManager: true }
    },
    {
        path: '/services',
        name: 'services',
        component: () => import('../components/ServicesPage.vue')
    },
    {
        path: '/status',
        name: 'status',
        component: () => import('../components/StatusPage.vue')
    },
    {
        path: '/order',
        name: 'order',
        component: () => import('../components/OrderPage.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Защита маршрутов
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || 'null')

    if (to.meta.requiresAuth && !token) {
        next('/login')
    } else if (to.meta.requiresAdmin && (!user || user.role !== 0)) {
        next('/')
    } else if (to.meta.requiresManager && (!user || (user.role !== 0 && user.role !== 1))) {
        next('/')
    } else {
        next()
    }
})

export default router
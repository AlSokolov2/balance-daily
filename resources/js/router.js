import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('./views/MainView.vue')
    },
    {
        path: '/stats',
        name: 'stats',
        component: () => import('./views/StatsView.vue')
    },
    {
        path: '/notepad',
        name: 'notepad',
        component: () => import('./views/NotepadView.vue')
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('./views/SettingsView.vue')
    },
    {
        path: '/task/:id',
        name: 'edit-task',
        component: () => import('./views/EditTaskView.vue')
    },
    {
        path: '/category/:slug',
        name: 'edit-category',
        component: () => import('./views/EditCategoryView.vue')
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;

import axios from 'axios';
window.axios = axios;

// Глобальная настройка Axios
const apiBase = (window.apiBaseUrl || '').replace(/\/$/, '');
window.axios.defaults.baseURL = apiBase + '/api/';
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Добавляем перехватчик для отладки и установки локали
window.axios.interceptors.request.use(config => {
    const locale = localStorage.getItem('locale') || 'ru';
    config.headers['X-Locale'] = locale;
    return config;
});

import axios from 'axios';

window.axios = axios;

// Глобальная настройка Axios
const apiBase = (window.apiBaseUrl || '').replace(/\/$/, '');
window.axios.defaults.baseURL = apiBase + '/api/';
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Добавляем перехватчик для отладки и установки локали
window.axios.interceptors.request.use(config => {
    config.headers['X-Locale'] = localStorage.getItem('locale') || 'ru';
    return config;
});

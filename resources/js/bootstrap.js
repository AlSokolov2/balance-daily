import axios from 'axios';
window.axios = axios;

// Глобальная настройка Axios для работы в подпапках
// Берем apiBaseUrl из window (установлен в blade) или вычисляем из текущего адреса
const rawBaseUrl = window.apiBaseUrl || window.location.origin + window.location.pathname.replace(/\/$/, '');
const cleanBaseUrl = rawBaseUrl.replace(/\/$/, '');

window.axios.defaults.baseURL = cleanBaseUrl + '/api/';
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Добавляем перехватчик для отладки (поможет увидеть финальные URL в консоли)
window.axios.interceptors.request.use(config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
});

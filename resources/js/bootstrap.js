import axios from 'axios';
window.axios = axios;

const baseUrl = (window.apiBaseUrl || '').replace(/\/$/, '');
window.axios.defaults.baseURL = baseUrl + '/api';
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

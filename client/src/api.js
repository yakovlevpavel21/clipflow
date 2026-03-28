import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

// Базовая настройка axios
axios.defaults.baseURL = API_URL;

// Автоматическая подстановка токена
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { API_URL };
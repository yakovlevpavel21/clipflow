import axiosLib from 'axios';
import { io } from 'socket.io-client';

const api = axiosLib.create({
  baseURL: '',
});

api.isCancel = axiosLib.isCancel;

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const socket = io({
  path: '/socket.io',
});

export const getDownloadUrl = (filePath, fileName) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    path: filePath,
    token: token || '',
    name: fileName || 'video.mp4'
  });
  return `/api/tasks/download-file?${params.toString()}`;
};

// Функция для скачивания файла как Blob
export const fetchFileAsBlob = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Ошибка загрузки');
  return await response.blob();
};

export default api;
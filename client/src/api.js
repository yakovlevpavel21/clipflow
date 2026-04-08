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

export const getDownloadUrl = (filePath) => {
  const token = localStorage.getItem('token');
  return `/api/tasks/download-file?path=${filePath}&token=${token}`;
};

export default api;
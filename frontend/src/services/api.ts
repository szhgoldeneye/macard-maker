import axios from 'axios';
import type {
  GenerateTextResponse,
  GenerateImageResponse,
  SaveCardResponse,
  HistoryListResponse,
  HistoryItem,
  User,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AI 生成
export const generateText = async (prompt?: string): Promise<GenerateTextResponse> => {
  const { data } = await api.post<GenerateTextResponse>('/ai/generate-text', { prompt });
  return data;
};

export const generateImage = async (
  prompt: string,
  width: number = 512,
  height: number = 512
): Promise<GenerateImageResponse> => {
  const { data } = await api.post<GenerateImageResponse>('/ai/generate-image', {
    prompt,
    width,
    height,
  });
  return data;
};

// 贺卡操作
export const saveCard = async (
  imageData: string,
  config?: object,
  blessingText?: string
): Promise<SaveCardResponse> => {
  const { data } = await api.post<SaveCardResponse>('/card/save', {
    image_data: imageData,
    config,
    blessing_text: blessingText,
  });
  return data;
};

export const downloadCard = (cardId: number): string => {
  return `/api/card/download/${cardId}`;
};

// 历史记录
export const getHistory = async (
  skip: number = 0,
  limit: number = 20
): Promise<HistoryListResponse> => {
  const { data } = await api.get<HistoryListResponse>('/history', {
    params: { skip, limit },
  });
  return data;
};

export const getHistoryItem = async (id: number): Promise<HistoryItem> => {
  const { data } = await api.get<HistoryItem>(`/history/${id}`);
  return data;
};

export const deleteHistoryItem = async (id: number): Promise<void> => {
  await api.delete(`/history/${id}`);
};

// 认证
export const getCurrentUser = async (): Promise<User> => {
  const { data } = await api.get<User>('/auth/me');
  return data;
};

export const login = (): void => {
  window.location.href = '/api/auth/login';
};

export const logout = (): void => {
  localStorage.removeItem('token');
  window.location.href = '/api/auth/logout';
};


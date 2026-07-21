import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, STORAGE_KEYS } from '../constants';
// Fallback mặc định duy nhất luôn là link Production trực tuyến
const getBaseUrl = (): string => {
  return 'https://nhatrovuive-gplu.onrender.com/api';
};

const API_URL = getBaseUrl();
console.log('Resolved fallback mobile API URL:', API_URL);

/**
 * Tải cấu hình mới nhất từ CDN và lưu vào AsyncStorage để sử dụng cho lần khởi động tiếp theo hoặc các request sau đó.
 */
export const fetchAndSaveDynamicApiUrl = async (): Promise<string | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // Giới hạn 3 giây để tránh đứng app khi mất mạng

  try {
    console.log('DEBUG: Fetching dynamic config from:', APP_CONFIG.CONFIG_URL);
    // Thêm cache-buster query parameter và headers để tránh bị cache bởi CDN (Vercel) hoặc HTTP cache của thiết bị
    const separator = APP_CONFIG.CONFIG_URL.includes('?') ? '&' : '?';
    const cleanUrl = `${APP_CONFIG.CONFIG_URL}${separator}_t=${Date.now()}`;
    const response = await fetch(cleanUrl, { 
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }
    const data = await response.json();
    console.log('DEBUG: Fetched data from config.json:', data);
    if (data && data.api_url) {
      await AsyncStorage.setItem(STORAGE_KEYS.DYNAMIC_API_URL, data.api_url);
      console.log('DEBUG: Saved new DYNAMIC_API_URL to AsyncStorage:', data.api_url);
      return data.api_url;
    } else {
      console.warn('DEBUG: data.api_url is missing in response:', data);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('DEBUG: Failed to fetch dynamic API URL config:', error);
  }
  return null;
};

const axiosInstance = axios.create({
  baseURL: API_URL, // Thiết lập fallback ban đầu
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const savedApiUrl = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_API_URL);
      console.log('DEBUG: Request Interceptor - savedApiUrl in AsyncStorage:', savedApiUrl);
      if (savedApiUrl) {
        config.baseURL = savedApiUrl;
      } else {
        config.baseURL = API_URL;
      }
    } catch (e) {
      console.error('DEBUG: Interceptor error:', e);
      config.baseURL = API_URL;
    }

    console.log(`DEBUG: Requesting full URL -> ${config.baseURL}${config.url}`);

    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // If backend returns the SkillBE.md envelope structure, unpack the nested data!
    if (
      response.data &&
      typeof response.data === 'object' &&
      Object.prototype.hasOwnProperty.call(response.data, 'success') &&
      Object.prototype.hasOwnProperty.call(response.data, 'data')
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Extract server-side business errors in the message property if present
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

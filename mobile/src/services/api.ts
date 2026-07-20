import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { APP_CONFIG, STORAGE_KEYS } from '../constants';

// For physical devices, we need the machine's local IP in development.
// Expo provides this via hostUri in development.
const getBaseUrl = (): string => {
  // In development (especially on physical devices), resolve the machine's actual LAN IP on the fly
  const debuggerHost = Constants.expoConfig?.hostUri || '';
  const localhost = debuggerHost.split(':')[0];
  
  if (localhost) {
    return `http://${localhost}:8080/api`;
  }
  
  // Last fallback if we are in production and CDN fetch hasn't completed yet
  return 'http://localhost:8080/api';
};

const API_URL = getBaseUrl();
console.log('Resolved fallback mobile API URL:', API_URL);

/**
 * Tải cấu hình mới nhất từ CDN và lưu vào AsyncStorage để sử dụng cho lần khởi động tiếp theo hoặc các request sau đó.
 */
export const fetchAndSaveDynamicApiUrl = async (): Promise<string | null> => {
  try {
    console.log('Fetching dynamic config from:', APP_CONFIG.CONFIG_URL);
    // Sử dụng fetch thuần để tránh đè interceptor hoặc tạo vòng lặp request vô tận
    const response = await fetch(APP_CONFIG.CONFIG_URL);
    if (!response.ok) {
      throw new Error(`HTTP status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.api_url) {
      await AsyncStorage.setItem(STORAGE_KEYS.DYNAMIC_API_URL, data.api_url);
      console.log('Successfully updated dynamic API URL:', data.api_url);
      return data.api_url;
    }
  } catch (error) {
    console.warn('Failed to fetch dynamic API URL config:', error);
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
      if (savedApiUrl) {
        config.baseURL = savedApiUrl;
      } else {
        config.baseURL = API_URL;
      }
    } catch (e) {
      config.baseURL = API_URL;
    }

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

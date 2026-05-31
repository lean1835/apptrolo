import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { APP_CONFIG, STORAGE_KEYS } from '../constants';

// For physical devices, we need the machine's local IP.
// Expo provides this via hostUri in development.
const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // 1. If EXPO_PUBLIC_API_URL is explicitly set and is NOT localhost/127.0.0.1, use it directly (production/staging)
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  
  // 2. In development (especially on physical devices), resolve the machine's actual LAN IP on the fly
  const debuggerHost = Constants.expoConfig?.hostUri || '';
  const localhost = debuggerHost.split(':')[0];
  
  if (localhost) {
    return `http://${localhost}:8080/api`;
  }
  
  // 3. Last fallback to APP_CONFIG
  return APP_CONFIG.API_URL;
};

const API_URL = getBaseUrl();
console.log('Resolved mobile API URL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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

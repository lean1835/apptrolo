/**
 * Cấu hình toàn cục của ứng dụng Mobile.
 * Lấy giá trị từ tệp môi trường .env thông qua tiền tố EXPO_PUBLIC_.
 */
export const APP_CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api',
  CRYPTO_SECRET: process.env.EXPO_PUBLIC_CRYPTO_SECRET || 'apptrololo_secure_secret_key_2026',
  DEFAULT_LANGUAGE: 'vi',
} as const;

/**
 * Các khóa lưu trữ AsyncStorage dùng chung trong ứng dụng để tránh viết sai chính tả.
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  LANGUAGE: 'app_language',
} as const;

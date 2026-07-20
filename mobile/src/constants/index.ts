/**
 * Cấu hình toàn cục của ứng dụng Mobile.
 * Lấy giá trị từ tệp môi trường .env thông qua tiền tố EXPO_PUBLIC_.
 */
export const APP_CONFIG = {
  CONFIG_URL: process.env.EXPO_PUBLIC_CONFIG_URL || 'https://raw.githubusercontent.com/username/repo/main/config.json',
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
  DYNAMIC_API_URL: 'dynamic_api_url',
} as const;

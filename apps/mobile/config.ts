import Constants from 'expo-constants';

// Get API URL from config or use default based on platform
const getApiUrl = (): string => {
  // Check if running on web
  const isWeb = typeof window !== 'undefined';
  
  // For web: use localhost
  // For mobile: use the machine's IP address
  const defaultUrl = isWeb 
    ? 'http://localhost:3000/api'
    : 'http://192.168.66.221:3000/api';

  // Allow override via expo config
  return Constants.expoConfig?.extra?.apiUrl || defaultUrl;
};

export const Config = {
  API_URL: getApiUrl(),
};

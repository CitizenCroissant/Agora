import type { AppConfig } from "@agora/shared";
import Constants from "expo-constants";

// Get API URL from config or use default based on platform
const getApiUrl = (): string => {
  const isWeb = typeof window !== "undefined";
  const defaultUrl = isWeb
    ? "http://localhost:3001/api"
    : "http://192.168.66.221:3001/api";

  const overrideUrl = Constants.expoConfig?.extra?.apiUrl;
  if (overrideUrl && typeof overrideUrl === "string") {
    return overrideUrl;
  }
  return defaultUrl;
};

export const Config = {
  API_URL: getApiUrl(),
} satisfies AppConfig;

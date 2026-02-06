import type { AppConfig } from "@agora/shared";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Get API URL from config or use default based on platform
const getApiUrl = (): string => {
  // Use Platform.OS for reliable platform detection
  const isWeb = Platform.OS === "web";

  // Check for explicit API URL override from app.json extra.apiUrl
  // Configure this in app.json with your machine's LAN IP for device access
  // Example: "http://192.168.1.100:3001/api" (replace with your actual IP)
  const overrideUrl = Constants.expoConfig?.extra?.apiUrl;
  if (
    overrideUrl &&
    typeof overrideUrl === "string" &&
    overrideUrl !== "null"
  ) {
    return overrideUrl;
  }

  // For web, use localhost
  if (isWeb) {
    return "http://localhost:3001/api";
  }

  // For mobile: Default to localhost (won't work from physical device)
  // User must configure via app.json extra.apiUrl with their LAN IP
  // See README.md for instructions on finding your LAN IP
  return "http://localhost:3001/api";
};

export const Config = {
  API_URL: getApiUrl(),
} satisfies AppConfig;

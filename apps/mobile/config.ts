import type { AppConfig } from "@agora/shared";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Production API URL - used for store builds
const PRODUCTION_API_URL = "https://api-beryl-zeta-77.vercel.app/api";

// Get API URL with the following priority:
// 1. EXPO_PUBLIC_API_URL env var (set by EAS build profiles for preview/production)
// 2. app.json extra.apiUrl (local dev override, e.g. LAN IP for physical devices)
// 3. Production URL for non-dev (store) builds
// 4. Fallback to localhost (web dev / simulator)
const getApiUrl = (): string => {
  // EAS build injects EXPO_PUBLIC_ env vars at build time
  // This is set in eas.json for preview and production profiles
  const easUrl = process.env.EXPO_PUBLIC_API_URL;
  if (easUrl && typeof easUrl === "string" && easUrl !== "null") {
    return easUrl;
  }

  // Check for explicit API URL override from app.json extra.apiUrl
  // Configure this in app.json with your machine's LAN IP for device access
  // Example: "http://192.168.1.100:3001/api" (replace with your actual IP)
  const overrideUrl = Constants.expoConfig?.extra?.apiUrl;
  if (
    overrideUrl &&
    typeof overrideUrl === "string" &&
    overrideUrl !== "null" &&
    !overrideUrl.includes("localhost")
  ) {
    return overrideUrl;
  }

  // In production builds (store), always use the production API
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  // For web dev, use localhost
  if (Platform.OS === "web") {
    return "http://localhost:3001/api";
  }

  // For mobile dev: Default to localhost (won't work from physical device)
  // User must configure via EXPO_PUBLIC_API_URL or app.json extra.apiUrl
  // See README.md for instructions on finding your LAN IP
  return "http://localhost:3001/api";
};

export const Config = {
  API_URL: getApiUrl()
} satisfies AppConfig;

import type { AppConfig } from "@agora/shared";

/**
 * Application configuration
 * Centralized configuration for environment variables and app settings
 */
export const Config = {
  /**
   * API base URL
   * Defaults to local development server if not set in environment
   */
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
} satisfies AppConfig;

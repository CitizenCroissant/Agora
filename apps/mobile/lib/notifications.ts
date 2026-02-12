/**
 * Push notifications: permission, Expo token, register/unregister with API
 *
 * Note: Push notifications require a development build (not supported in Expo Go SDK 53+)
 * This uses lazy loading to avoid module loading errors
 */

import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

export type PushTopic = "all" | "my_deputy";

/** AsyncStorage key for the user's chosen deputy (acteur_ref) for "my_deputy" push topic */
export const FAVORITE_DEPUTY_KEY = "@agora_favorite_deputy";

export interface RegisterPushOptions {
  apiUrl: string;
  topic?: PushTopic;
  deputyActeurRef?: string | null;
}

// Lazy load expo-notifications to avoid module loading errors
let NotificationsModule: typeof import("expo-notifications") | null = null;
let notificationsLoaded = false;

function getNotifications() {
  if (notificationsLoaded) {
    return NotificationsModule;
  }
  notificationsLoaded = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require("expo-notifications");
  } catch {
    NotificationsModule = null;
  }
  return NotificationsModule;
}

/**
 * Configure how notifications are presented when app is foregrounded
 */
export function setupNotificationHandler() {
  const Notifs = getNotifications();
  if (Notifs) {
    Notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      })
    });
  }
}

/**
 * Request permissions and return Expo push token, or null if not granted / not a device
 * Returns null if expo-notifications is not available (e.g., in Expo Go)
 */
export async function getExpoPushTokenAsync(): Promise<{
  token: string | null;
  error?: string;
}> {
  const Notifs = getNotifications();
  if (!Notifs) {
    return {
      token: null,
      error:
        "expo-notifications non disponible. Utilisez un development build (pas Expo Go)."
    };
  }

  if (!Device.isDevice) {
    return {
      token: null,
      error:
        "Les notifications push nécessitent un appareil physique (pas un simulateur)."
    };
  }

  try {
    const { status: existingStatus } = await Notifs.getPermissionsAsync();

    let status = existingStatus;
    if (existingStatus !== "granted") {
      const { status: newStatus } = await Notifs.requestPermissionsAsync();
      status = newStatus;
    }

    if (status !== "granted") {
      return {
        token: null,
        error:
          "Permission de notification refusée. Activez-la dans les paramètres de l'appareil."
      };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;

    if (!projectId) {
      return {
        token: null,
        error:
          "projectId manquant. Exécutez 'eas build:configure' pour configurer le projet EAS."
      };
    }

    const tokenResult = await Notifs.getExpoPushTokenAsync({
      projectId
    });
    return { token: tokenResult?.data ?? null };
  } catch (error) {
    return {
      token: null,
      error:
        error instanceof Error
          ? error.message
          : "Erreur lors de la récupération du token."
    };
  }
}

/**
 * Register the current device token with the backend
 */
export async function registerPushToken(
  token: string,
  options: RegisterPushOptions
): Promise<{ ok: boolean; error?: string }> {
  const { apiUrl, topic = "all", deputyActeurRef = null } = options;
  const url = `${apiUrl.replace(/\/$/, "")}/push/register`;
  const body: Record<string, string | null> = {
    expo_push_token: token,
    topic
  };
  if (topic === "my_deputy" && deputyActeurRef) {
    body.deputy_acteur_ref = deputyActeurRef;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          (data as { message?: string }).message ?? "Échec de l'enregistrement"
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur réseau"
    };
  }
}

/**
 * Unregister the token from the backend
 */
export async function unregisterPushToken(
  token: string,
  apiUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `${apiUrl.replace(/\/$/, "")}/push/register`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expo_push_token: token })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          (data as { message?: string }).message ??
          "Échec de la désinscription"
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur réseau"
    };
  }
}

/**
 * Check if push notifications are supported
 * Returns false in Expo Go (SDK 53+) or on simulators
 */
export function isPushSupported(): boolean {
  const Notifs = getNotifications();
  if (!Notifs) {
    return false;
  }

  // Check if running in Expo Go (development builds have expo-dev-client)
  const isExpoGo = !Constants.expoConfig?.plugins?.includes("expo-dev-client");
  if (isExpoGo) {
    return false;
  }

  return (
    Device.isDevice && (Platform.OS === "ios" || Platform.OS === "android")
  );
}

/**
 * Get a user-friendly error message explaining why push isn't supported
 */
export function getPushSupportError(): string | null {
  const Notifs = getNotifications();
  if (!Notifs) {
    return "expo-notifications non disponible. Utilisez un development build (pas Expo Go).";
  }

  const isExpoGo = !Constants.expoConfig?.plugins?.includes("expo-dev-client");
  if (isExpoGo) {
    return "Les notifications push nécessitent un development build. Expo Go ne les supporte pas.";
  }

  if (!Device.isDevice) {
    return "Les notifications push nécessitent un appareil physique (pas un simulateur).";
  }

  return null;
}

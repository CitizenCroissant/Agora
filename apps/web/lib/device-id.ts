/**
 * Lightweight anonymous identity for "I'm following this" (no login).
 * Persists a device-scoped ID in localStorage so follows survive refresh.
 * Only call from client (e.g. inside useEffect or event handlers).
 */

const STORAGE_KEY = "agora_device_id";

function generateId(): string {
  return crypto.randomUUID?.() ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Returns the current device id, creating and persisting one if needed.
 * Must be called in the browser (uses localStorage).
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || !id.trim()) {
      id = generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

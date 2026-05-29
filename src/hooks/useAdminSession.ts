import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "bc26_admin_pw";

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): null {
  return null;
}

export function useAdminPassword(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setAdminPasswordInSession(password: string) {
  sessionStorage.setItem(STORAGE_KEY, password);
  listeners.forEach((l) => l());
}

export function clearAdminSession() {
  sessionStorage.removeItem(STORAGE_KEY);
  listeners.forEach((l) => l());
}

export function useAdminLogout() {
  return useCallback(() => clearAdminSession(), []);
}

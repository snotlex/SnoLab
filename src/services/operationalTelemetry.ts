export type OperationalEventType = "client_error" | "unhandled_rejection" | "report_export" | "navigation_blocked";

export interface OperationalEvent {
  id: string;
  type: OperationalEventType;
  timestamp: string;
  message: string;
  route?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

const STORAGE_KEY = "snolab_operational_events_v1";
const MAX_EVENTS = 100;

const isBrowser = () => typeof window !== "undefined";

export function recordOperationalEvent(event: Omit<OperationalEvent, "id" | "timestamp">): void {
  if (!isBrowser()) return;
  const next: OperationalEvent = {
    ...event,
    id: `OPS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    route: event.route || window.location.pathname
  };
  try {
    const current = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as OperationalEvent[];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...current].slice(0, MAX_EVENTS)));
  } catch {
    // Telemetry must never break the engineering workflow when storage is unavailable.
  }
}

export function getOperationalEvents(): OperationalEvent[] {
  if (!isBrowser()) return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value as OperationalEvent[] : [];
  } catch {
    return [];
  }
}

export function clearOperationalEvents(): void {
  if (!isBrowser()) return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* best effort */ }
}

export function installOperationalErrorMonitoring(): () => void {
  if (!isBrowser()) return () => undefined;
  const onError = (event: ErrorEvent) => recordOperationalEvent({ type: "client_error", message: event.message || "Unknown client error", metadata: { filename: event.filename || null, line: event.lineno || null, column: event.colno || null } });
  const onRejection = (event: PromiseRejectionEvent) => recordOperationalEvent({ type: "unhandled_rejection", message: event.reason instanceof Error ? event.reason.message : String(event.reason || "Unknown promise rejection") });
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

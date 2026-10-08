import { describe, expect, it, beforeEach } from "vitest";
import { clearOperationalEvents, getOperationalEvents, recordOperationalEvent } from "./operationalTelemetry";

describe("operational telemetry", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    Object.defineProperty(globalThis, "window", { configurable: true, value: {
      location: { pathname: "/" },
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key)
      }
    }});
  });

  it("stores a bounded client event with a timestamp and route", () => {
    recordOperationalEvent({ type: "client_error", message: "example" });
    const [event] = getOperationalEvents();
    expect(event.type).toBe("client_error");
    expect(event.message).toBe("example");
    expect(event.timestamp).toBeTruthy();
    expect(event.route).toBe("/");
  });

  it("clears events without throwing", () => {
    recordOperationalEvent({ type: "report_export", message: "exported" });
    clearOperationalEvents();
    expect(getOperationalEvents()).toEqual([]);
  });
});

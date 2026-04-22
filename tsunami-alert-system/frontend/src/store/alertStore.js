import { create } from "zustand";

export const useAlertStore = create((set) => ({
  activeAlerts: [],
  setActiveAlerts: (alerts) => set({ activeAlerts: Array.isArray(alerts) ? alerts : [] }),
  lastPush: null,
  setLastPush: (payload) => set({ lastPush: payload }),
}));

export const ALERT_COLORS = {
  WATCH: { bg: "#FEF9C3", border: "#EAB308", text: "#713F12" },
  ADVISORY: { bg: "#FED7AA", border: "#F97316", text: "#7C2D12" },
  WARNING: { bg: "#FEE2E2", border: "#EF4444", text: "#7F1D1D" },
};

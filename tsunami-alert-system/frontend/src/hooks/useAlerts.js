import { useEffect } from "react";
import { fetchActiveAlerts } from "../services/alertService";
import { useAlertStore } from "../store/alertStore";

const POLL = 30_000;

export function useAlerts() {
  const { activeAlerts, setActiveAlerts } = useAlertStore();

  useEffect(() => {
    let t;
    const load = async () => {
      try {
        const a = await fetchActiveAlerts();
        setActiveAlerts(a);
      } catch (e) {
        console.warn("alerts poll", e);
      }
    };
    load();
    t = setInterval(load, POLL);
    return () => clearInterval(t);
  }, [setActiveAlerts]);

  return activeAlerts;
}

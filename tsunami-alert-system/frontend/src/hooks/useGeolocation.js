import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { registerUser, updateUserLocation } from "../services/alertService";

const INTERVAL_MS = 30000;
const USER_KEY = "tsunami_alert_user_id";

/**
 * Request permission, watch position, and sync backend every 30s.
 */
export function useGeolocation() {
  const [pos, setPos] = useState(null);
  const [error, setError] = useState(null);
  const [consent, setConsent] = useState("unknown");
  const [params] = useSearchParams();
  const userIdRef = useRef(localStorage.getItem(USER_KEY));

  const postLocation = useCallback(
    async (lat, lng) => {
      try {
        if (userIdRef.current) {
          await updateUserLocation(userIdRef.current, { lat, lng });
        } else {
          const u = await registerUser({
            name: params.get("name") || "Coastal user",
            fcm_token: null,
            lat,
            lng,
          });
          userIdRef.current = u.id;
          localStorage.setItem(USER_KEY, u.id);
        }
      } catch (e) {
        console.warn("location sync", e);
      }
    },
    [params]
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not available in this browser.");
      return;
    }
  }, []);

  useEffect(() => {
    if (consent === "denied" || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setConsent("granted");
        const c = p.coords;
        setPos({ lat: c.latitude, lng: c.longitude, accuracy: c.accuracy });
        postLocation(c.latitude, c.longitude);
      },
      (e) => {
        if (e?.code === 1) setConsent("denied");
        setError(e?.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [consent, postLocation]);

  useEffect(() => {
    if (!pos) return;
    const t = setInterval(
      () => postLocation(pos.lat, pos.lng),
      INTERVAL_MS
    );
    return () => clearInterval(t);
  }, [pos, postLocation]);

  return { pos, error, consent, setConsent, userIdRef };
}

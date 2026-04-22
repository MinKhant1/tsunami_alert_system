import { useCallback, useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseApp, getFirebaseMessaging } from "../firebase";
import { useAlertStore } from "../store/alertStore";
import { registerUser, updateUserLocation } from "../services/alertService";
import { useSearchParams } from "react-router-dom";

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const USER_KEY = "tsunami_alert_user_id";

/**
 * Request permission, FCM token, and sync with /users (register or location+fcm).
 */
export function usePushNotifications({ pos }) {
  const { setLastPush } = useAlertStore();
  const [status, setStatus] = useState("idle");
  const [params] = useSearchParams();

  useEffect(() => {
    if (!VAPID || !getFirebaseApp()) {
      return;
    }
    (async () => {
      const m = await getFirebaseMessaging();
      if (m) onMessage(m, (payload) => setLastPush(payload));
    })();
  }, [setLastPush]);

  const requestAndRegister = useCallback(async () => {
    if (!VAPID || !getFirebaseApp()) {
      setStatus("unconfigured");
      return;
    }
    if (!("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setStatus("denied");
      return;
    }
    const m = await getFirebaseMessaging();
    if (!m) {
      setStatus("no_messaging");
      return;
    }
    const token = await getToken(m, { vapidKey: VAPID });
    if (!token) {
      setStatus("no_token");
      return;
    }
    const lat = pos?.lat ?? 10;
    const lng = pos?.lng ?? 80;
    const name = params.get("name") || "Coastal user";
    const existing = localStorage.getItem(USER_KEY);
    try {
      if (existing) {
        await updateUserLocation(existing, { lat, lng, fcm_token: token });
      } else {
        const u = await registerUser({ name, fcm_token: token, lat, lng });
        if (u?.id) localStorage.setItem(USER_KEY, u.id);
      }
    } catch (e) {
      console.warn("fcm + backend", e);
    }
    onMessage(m, (payload) => setLastPush(payload));
    setStatus("ok");
  }, [pos, params, setLastPush]);

  return { requestAndRegister, status };
}

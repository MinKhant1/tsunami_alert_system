import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported, getToken, onMessage } from "firebase/messaging";

const createConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export function getFirebaseApp() {
  const cfg = createConfig();
  if (!cfg.apiKey) return null;
  try {
    if (!getApps().length) {
      return initializeApp(cfg);
    }
    return getApp();
  } catch {
    return null;
  }
}

let messaging = null;
export async function getFirebaseMessaging() {
  if (messaging) return messaging;
  if (!(await isSupported())) return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    messaging = getMessaging(app);
    return messaging;
  } catch {
    return null;
  }
}

export async function requestFcmToken(vapidKey) {
  const m = await getFirebaseMessaging();
  if (!m || !vapidKey) return null;
  return getToken(m, { vapidKey });
}

export function onForegroundMessage(handler) {
  (async () => {
    const m = await getFirebaseMessaging();
    if (m) onMessage(m, handler);
  })();
}

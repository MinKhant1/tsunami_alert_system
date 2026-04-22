import axios from "axios";

/** Prefer same host as the SPA so 127.0.0.1:3000 calls 127.0.0.1:8000 (avoids "Network Error" with localhost vs 127.0.0.1). */
function defaultApiBase() {
  if (typeof window === "undefined" || !window.location?.hostname) {
    return "http://localhost:8000";
  }
  return `http://${window.location.hostname}:8000`;
}

const envBase = import.meta.env.VITE_API_BASE_URL;
const base =
  typeof envBase === "string" && envBase.trim() !== "" ? envBase.trim() : defaultApiBase();

export const api = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

export default api;

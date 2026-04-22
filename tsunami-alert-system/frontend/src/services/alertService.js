import api from "./api";

export async function fetchActiveAlerts() {
  const { data } = await api.get("/alerts/active");
  return data.alerts || [];
}

/** Admin: soft-deactivate (remove from active list). */
export async function deleteActiveAlert(alertId) {
  await api.delete(`/admin/alerts/${alertId}`);
}

export async function fetchAlertById(id) {
  const { data } = await api.get(`/alerts/${id}`);
  return data;
}

export async function postSimulateEvent(payload) {
  const { data } = await api.post("/admin/simulate-event", payload);
  return data;
}

export async function registerUser(body) {
  const { data } = await api.post("/users/register", body);
  return data;
}

export async function updateUserLocation(id, { lat, lng }) {
  const { data } = await api.put(`/users/${id}/location`, { lat, lng });
  return data;
}

export async function fetchRecentEvents() {
  const { data } = await api.get("/events/recent");
  return data;
}

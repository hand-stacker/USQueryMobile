import { authRequest } from "../hooks/authRequest";

export async function getNotifPreferences() {
  return authRequest('notif/get-preferences/', { method: 'GET' });
}

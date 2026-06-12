import { authRequest } from "../hooks/authRequest";

interface FloorPrefsPayload {
  house?: boolean;
  senate?: boolean;
  house_frequency?: number;
  senate_frequency?: number;
  house_time?: number;
  senate_time?: number;
  house_timezone?: string;
  senate_timezone?: string;
}

export async function updateFloorPrefs(payload: FloorPrefsPayload) {
  return authRequest('notif/update-floor-preferences/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

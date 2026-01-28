import { authRequest } from "../hooks/authRequest";

export async function updateFavorites(subject_ids: number[]) {
  return authRequest(`notif/update-favorites/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject_ids: subject_ids,
    }),
  });
}

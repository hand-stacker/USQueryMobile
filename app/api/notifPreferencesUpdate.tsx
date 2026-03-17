import { authRequest } from "../hooks/authRequest";

export async function updatePrefs(bill_pref?: boolean, subj_pref?: boolean) {
  if (bill_pref == null && subj_pref == null) return;

  const payload: { bill?: boolean; subject?: boolean } = {};
  if (bill_pref != null) payload.bill = bill_pref;
  if (subj_pref != null) payload.subject = subj_pref;
  console.log("Updating notification preferences with payload:", payload);

  return authRequest(`notif/update-favorites/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
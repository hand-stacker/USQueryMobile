import { authRequest } from "../hooks/authRequest";

export async function starMember(memberId: string) {
  return authRequest(`notif/star-membership/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      membership_id: memberId,
    }),
  });
}

export async function unstarMember(memberId: string) {
  return authRequest(`notif/unstar-membership/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      membership_id: memberId,
    }),
  });
}

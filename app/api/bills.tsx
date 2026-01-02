import AsyncStorage from "@react-native-async-storage/async-storage";

const API = "https://usquery.com/api/notif";

export async function starBill(billId: string) {
  const token = await AsyncStorage.getItem("deviceToken");

  return fetch(`${API}/star-bill/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bill_id: billId,
      device_token: token,
    }),
  });
}

export async function unstarBill(billId: string) {
  const token = await AsyncStorage.getItem("deviceToken");

  return fetch(`${API}/unstar-bill/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bill_id: billId,
      device_token: token,
    }),
  });
}

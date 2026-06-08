import { retrieveUserSession, storeUserSession } from "@/app/encrypted-storage/functions";
import { useCallback, useState } from "react";

const GRAPHQL_URL = "https://www.usquery.com/api/v1.0/graphql/";

const CHAT_MUTATION = `mutation SendChat($billId: Int!, $message: String!, $sessionId: String, $accessToken: String, $refreshToken: String, $hyperMode: Boolean) {
  sendChatMessage(billId: $billId, message: $message, sessionId: $sessionId, accessToken: $accessToken, refreshToken: $refreshToken, hyperMode: $hyperMode) {
    sessionId assistantMessage error messagesRemaining sources monthlyCostPct newAccessToken
  }
}`;

export interface ChatMutationResult {
  sessionId?: string;
  assistantMessage?: string;
  error?: string;
  messagesRemaining?: number | null;
  sources?: string[];
  monthlyCostPct?: number | null;
  newAccessToken?: string;
}

export function useSendChatMessage(billId: number) {
  const [sending, setSending] = useState(false);

  const send = useCallback(async (message: string, sessionId: string | null, hyperMode = false): Promise<ChatMutationResult> => {
    setSending(true);
    try {
      const session = await retrieveUserSession();
      const body = JSON.stringify({
        query: CHAT_MUTATION,
        variables: {
          billId,
          message,
          sessionId,
          accessToken: session?.accessToken ?? null,
          refreshToken: session?.refreshToken ?? null,
          hyperMode,
        },
      });

      const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body,
      });

      const json = await response.json();
      const result: ChatMutationResult = json?.data?.sendChatMessage;

      if (!result) throw new Error("No response from server");

      if (result.newAccessToken && session) {
        await storeUserSession(session.email, result.newAccessToken, session.refreshToken, session.isVerified);
      }

      return result;
    } finally {
      setSending(false);
    }
  }, [billId]);

  return { send, sending };
}

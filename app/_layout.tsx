import { ApolloProvider } from "@apollo/client/react";
import { Stack } from "expo-router";
import { client } from "./api/apollo";
import './globals.css';

export default function RootLayout() {
  return (
    <ApolloProvider client={client}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="bill/[bill_id]_info_sm"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="bill/[bill_id]_info"
          options={{ headerShown: false }}
        />
      </Stack>
    </ApolloProvider>
  );
}

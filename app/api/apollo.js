import { ApolloClient, InMemoryCache } from "@apollo/client";

import { HttpLink } from "@apollo/client";

const uri = "https://www.usquery.com/api/v1.0/graphql/";
const link = new HttpLink({ uri });

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

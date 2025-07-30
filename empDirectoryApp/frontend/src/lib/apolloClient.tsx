
'use client'
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { ReactNode } from "react";

const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:8000/graphql",
  cache: new InMemoryCache(),
});

export default client;

export const ApolloProviderWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};
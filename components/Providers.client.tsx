"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * App-wide TanStack Query client. Collection state (case statuses, owned
 * devices) is fetched through it, so every component on a page shares one
 * cache and mutations invalidate everywhere at once. The client lives in
 * state so HMR and re-renders never rebuild it (and its cache) from scratch.
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            // Long enough to dedupe within a page visit, short enough that
            // navigating back shows fresh collection state.
            staleTime: 15_000,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

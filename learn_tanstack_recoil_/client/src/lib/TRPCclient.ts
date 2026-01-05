import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

import type { appRouter } from "../../../server/src/appRouter";
import superjson from "superjson";

export const client = createTRPCProxyClient<appRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:4000/trpc",
      maxURLLength: 2083,
      transformer: superjson,
    }),
  ],
});

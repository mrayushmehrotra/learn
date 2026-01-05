import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { UserContext } from "./ctx";

type TrpcContext = {
  c: UserContext;
};

export const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.c.session) {
    throw new Error("Unauthorized");
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.c.session,
    },
  });
});

import { t } from "./TRPCserver";
import { UserProdecure } from "./module/user/userRouter";

export const AppRouter = t.router({
  ...UserProdecure,
});
export type appRouter = typeof AppRouter;

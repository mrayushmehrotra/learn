import { createTRPCProxyClient } from '@trpc/client';
import { AppRouter as PaymentsRouter } from '@repo/trpc/PaymentsRouter';
export const CLIENTS = `CLIENTS`;

export interface Clients {
  paymentClient: ReturnType<typeof createTRPCProxyClient<PaymentsRouter>>;
}

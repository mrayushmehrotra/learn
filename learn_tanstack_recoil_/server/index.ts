import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { AppRouter } from "./src/appRouter";
import { createContext } from "./src/ctx";
import cors from "cors";

const PORT = 4000;
const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/trpc",
  createExpressMiddleware({
    router: AppRouter,
    createContext,
  }),
);

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

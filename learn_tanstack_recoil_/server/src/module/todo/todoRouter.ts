import { publicProcedure } from "../../TRPCserver";
import { CreateTodoSchema } from "./todo.dto";

export const TodoRouter = {
  createTodo: publicProcedure.input(CreateTodoSchema).mutation(async (opts) => {
    const { input } = opts;
    const safeInput = await CreateTodoSchema.safeParseAsync(input);

    if (safeInput.success) {
      const createdTodo = await safeInput.data;
      return;
    }
  }),
};

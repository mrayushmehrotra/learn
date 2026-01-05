import z from "zod";
import { publicProcedure } from "../../TRPCserver";
import { UserSchema } from "./user.dto";
import { UserClassRepository } from "./user.repository";

const User = new UserClassRepository();

export const UserProdecure = {
  createUser: publicProcedure.input(UserSchema).mutation(async (opts) => {
    const { input } = opts;

    try {
      const safeInput = await UserSchema.safeParseAsync(input);

      if (!safeInput.success) {
        throw new Error(`Validation failed: ${safeInput.error.message}`);
      }

      const createdUser = await User.create(safeInput.data);
      return createdUser;
    } catch (error) {
      console.error("Create user error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create user",
      );
    }
  }),
  updateUser: publicProcedure.input(UserSchema).mutation(async (opts) => {
    const { input } = opts;
    const safeInput = await UserSchema.safeParseAsync(input);

    if (safeInput.success && safeInput.data.id) {
      const updatedUser = await User.update(safeInput.data.id, safeInput.data);
      return updatedUser;
    }
  }),
  getUserInfo: publicProcedure.input(z.string()).query(async (opts) => {
    const { input } = opts;
    const safeInput = await z.string().safeParseAsync(input);

    if (safeInput.success) {
      const user = await User.getUserInfo(safeInput.data);
      return user;
    }
  }),
};

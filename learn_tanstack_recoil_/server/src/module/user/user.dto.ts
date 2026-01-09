import z from "zod";

export const UserSchema = z.object({
  id: z.string().min(5).optional(),
  name: z.string().min(1),
  email: z.email({ error: "invalid email address" }),
  hashedPassword: z.string(),
  avatar: z.string().min(10).nullable().optional(),
  isActive: z.boolean().default(true),
  isPro: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  todos: z.object({}).optional(),
});

export type userSchema = z.infer<typeof UserSchema>;

export type CreateUserDto = Omit<userSchema, "id" | "createdAt" | "updatedAt">;
export type UpdateUserDto = Partial<CreateUserDto>;

export interface UserManager {
  create(arg0: CreateUserDto): Promise<userSchema>;
  delete(id: string): Promise<void>;
  update(id: string, updateData: UpdateUserDto): Promise<userSchema>;
  getUserInfo(id: string): Promise<userSchema | null>;
  // FIXME: add the TODO type here
  getAllTodos(): Promise<any>;
}


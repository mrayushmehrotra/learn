// INFO: this repo will only do the operation for Users from the DB

import { prisma } from "../../db/prismaClient";
import type { UserManager, userSchema } from "./user.dto";
import type { User as PrismaUser, User } from "@prisma/client";

// Convert Prisma user to our userSchema
const toUserSchema = (prismaUser: PrismaUser) => ({
  id: prismaUser.id,
  name: prismaUser.name,
  email: prismaUser.email,
  hashedPassword: prismaUser.hashedPassword,
  avatar: prismaUser.avatar || "",
  isActive: prismaUser.isActive,
  isPro: false, // Default value since it's not in Prisma schema
  createdAt: prismaUser.createdAt,
  updatedAt: prismaUser.updatedAt,
  todos: {}, // Default empty object
});

export class UserClassRepository implements UserManager {
  constructor() {}

  async create(data: userSchema) {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        hashedPassword: data.hashedPassword,
        avatar: data.avatar,
        isActive: data.isActive,
      },
    });
    return toUserSchema(user);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async update(id: string, updateData: userSchema) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: updateData.name,
        email: updateData.email,
        hashedPassword: updateData.hashedPassword,
        avatar: updateData.avatar,
        isActive: updateData.isActive,
      },
    });
    return toUserSchema(user);
  }

  async getUserInfo(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return toUserSchema(user);
  }

  async getAllTodos(): Promise<any> {
    return await prisma.todo.findMany();
  }

  async getAllUsers() {
    const data = await prisma.user.findMany();
    console.log("data", data);
    return data.map(toUserSchema);
  }
}

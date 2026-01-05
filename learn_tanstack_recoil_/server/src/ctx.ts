import jwt from "jsonwebtoken";
import type { userSchema } from "./module/user/user.dto";
import { tryCatch } from "./lib/tryCatch";

export type UserContext = {
  session: userSchema | null;
};

export const createContext = async ({ req }: { req: any }) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return { c: { session: null } };
  }

  const verifyToken = async () => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // TODO: Replace with actual database query
    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.userId },
    //   select: {
    //     id: true,
    //     name: true,
    //     email: true,
    //     avatar: true,
    //     isActive: true,
    //     createdAt: true,
    //     updatedAt: true,
    //   },
    // });

    // Mock user for now
    const mockUser: userSchema = {
      id: decoded.userId,
      name: "Mock User",
      email: "mock@example.com",
      hashedPassword: "hashed",
      avatar: "https://example.com/avatar.jpg",
      isActive: true,
      isPro: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      todos: {},
    };

    return { c: { session: mockUser } };
  };

  const [data, error] = await tryCatch(verifyToken());

  if (error) {
    console.error("JWT verification failed:", error);
    return { c: { session: null } };
  }

  return data;
};

import { useMutation, useQuery } from "@tanstack/react-query";
import { client } from "../lib/TRPCclient";
import type { CreateUserInput, User, ApiError } from "../types/user";

export function useGetAllUsers() {
  return useQuery<User[]>({
    queryKey: ["getAllUsers"],
    queryFn: async () => await client.getAllUsers.query(),
  });
}

export function useCreateUser() {
  const mutation = useMutation<User | null, ApiError, CreateUserInput>({
    mutationKey: ["createUser"],
    mutationFn: async (input: CreateUserInput): Promise<User | null> => {
      try {
        const result = await client.createUser.mutate(input);
        return result ?? null;
      } catch (err) {
        console.error("Create user mutation error:", err);
        throw err instanceof Error
          ? {
            message: err.message,
            code: "CREATE_USER_FAILED",
            httpStatus: 500,
          }
          : {
            message: "Unknown error occurred",
            code: "CREATE_USER_FAILED",
            httpStatus: 500,
          };
      }
    },
  });

  return {
    createUser: mutation.mutate,
    createUserAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
}

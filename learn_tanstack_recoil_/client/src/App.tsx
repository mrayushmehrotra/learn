import { useCreateUser, useGetAllUsers } from "./hooks/useCreateUser";
import { useForm, type SubmitHandler } from "react-hook-form";

export function App() {
  type User = {
    name: string;
    email: string;
    hashedPassword: string;
    avatar?: string;
    isActive?: boolean;
    isPro?: boolean;
    todos?: Record<string, never>;
  };
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<User>();
  const { createUser, isLoading, error, data, isSuccess, isError } =
    useCreateUser();

  const { data: userData } = useGetAllUsers();
  console.log("userData", userData);
  const onSubmit: SubmitHandler<User> = (data) => {
    createUser({
      ...data,
    });
    console.log(data);
  };
  watch("email");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {userData?.map((user) => (
        <div key={user.id}>
          <p>{user.name}</p>
          <p>{user.email}</p>
        </div>
      ))}

      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Create User
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              defaultValue="John Doe"
              {...register("name", { required: "Name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors?.name && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Invalid email format",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors?.email && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="hashedPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="hashedPassword"
              type="password"
              {...register("hashedPassword", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors?.hashedPassword && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.hashedPassword.message}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="avatar"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Avatar URL (optional)
            </label>
            <input
              id="avatar"
              type="url"
              {...register("avatar")}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                {...register("isActive")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-700"
              >
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isPro"
                type="checkbox"
                {...register("isPro")}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isPro"
                className="ml-2 block text-sm text-gray-700"
              >
                Pro User
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating User...
              </span>
            ) : (
              "Create User"
            )}
          </button>
        </form>

        {isError && error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-sm">Error: {error.message}</div>
          </div>
        )}

        {isSuccess && data && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-green-800 text-sm">
              User created successfully: {data.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

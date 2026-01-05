import { useCreateUser } from "./hooks/useCreateUser";

export function App() {
  const { createUser, isLoading, error, data, isSuccess, isError } =
    useCreateUser();

  const handleCreateUser = () => {
    createUser({
      name: "ayush",
      email: "ayushnew@gmail.com",
      hashedPassword: "123456",
      avatar: "https://avatars.githubusercontent.com/u/10028281?v=4",
      isActive: true,
      isPro: false,
      todos: {},
    });
  };

  return (
    <div>
      <button onClick={handleCreateUser} disabled={isLoading}>
        {isLoading ? "Creating User..." : "Create User"}
      </button>
      {isError && error && <div>Error: {error.message}</div>}
      {isSuccess && data && <div>User created: {data.name}</div>}
    </div>
  );
}

export default App;

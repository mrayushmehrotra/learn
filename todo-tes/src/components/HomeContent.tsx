"use client";

import { useEffect, useState } from "react";

const HomeContent = () => {
  const [todoTitle, setTodoTitle] = useState("");
  const [todos, setTodos] = useState([]);

  // Load from localStorage on first render
  useEffect(() => {
    const stored = localStorage.getItem("get_todos");
    if (stored) {
      setTodos(JSON.parse(stored));
    }
  }, []);

  // Save whenever todos change
  useEffect(() => {
    localStorage.setItem("get_todos", JSON.stringify(todos));
  }, [todos]);

  // Add Todo
  const addTodo = () => {
    if (!todoTitle.trim()) return;

    const newTodo = {
      id: crypto.randomUUID(),
      title: todoTitle,
      completed: false,
    };

    setTodos((prev) => [...prev, newTodo]);
    setTodoTitle("");
  };

  // Delete Todo
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  // Mark Complete (Normal Toggle)
  const markComplete = (id) => {
    // for single completion tick
    setTodos((prev) =>
      prev.map((todo) => ({
        ...todo,
        completed: todo.id === id,
      })),
    );

    // for multiple completion tick
    // setTodos((prev) =>
    //   prev.map((todo) =>
    //     todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    //   ),
    // );
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Todos</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="go to gym..."
          value={todoTitle}
          onChange={(e) => setTodoTitle(e.target.value)}
          className="border p-2 rounded w-64"
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Add Todo
        </button>
      </div>

      {/* Live Counts */}
      <div className="mb-4">
        <p>Total: {todos.length}</p>
        <p>Completed: {todos.filter((t) => t.completed).length}</p>
        <p>Pending: {todos.filter((t) => !t.completed).length}</p>
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        {todos.map((todo) => (
          <div
            key={todo.id}
            onClick={() => markComplete(todo.id)}
            className={`border p-3 rounded flex justify-between items-center ${
              todo.completed ? "opacity-50 line-through" : ""
            }`}
          >
            <span className="cursor-pointer">{todo.title}</span>

            <button
              onClick={() => deleteTodo(todo.id)}
              className="bg-red-500 text-white px-2 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeContent;

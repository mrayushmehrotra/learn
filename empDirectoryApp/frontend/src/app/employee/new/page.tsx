"use client";
import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { CREATE_EMPLOYEE } from "../../../../graphql/query/employee";

const DEPARTMENTS = [
  "Sales",
  "Marketing",
  "Engineering",
  "Human Resources",
  "Finance",
];

export default function AddEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    position: "",
    salary: "",
    department: DEPARTMENTS[0],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [createEmployee, { loading, error, data }] = useMutation(
    CREATE_EMPLOYEE,
    {
      refetchQueries: ["GET_EMPLOYEES"],
    },
  );

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.position) errs.position = "Position is required";
    if (!form.salary || isNaN(Number(form.salary)))
      errs.salary = "Valid salary is from 0-1000000 ";
    if (!form.department) errs.department = "Department is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Transform name: replace all spaces (including multiple) with a single underscore, trim underscores
    const transformedName = form.name.trim().replace(/\s+/g, "_");
    await createEmployee({
      variables: {
        input: { ...form, name: transformedName, salary: Number(form.salary) },
      },
      onCompleted: () => router.push("/"),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <button
          className="mb-6 text-blue-600 hover:underline font-semibold"
          onClick={() => router.push("/")}
        >
          &larr; Back to Home
        </button>
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          Add New Employee
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-black   font-semibold mb-1">
              Name
            </label>
            <input
              className="w-full text-black border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && (
              <div className="text-red-500 text-sm mt-1">{errors.name}</div>
            )}
          </div>
          <div>
            <label className="block text-black    font-semibold mb-1">
              Position
            </label>
            <input
              className="w-full text-black  border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.position}
              onChange={(e) =>
                setForm((f) => ({ ...f, position: e.target.value }))
              }
            />
            {errors.position && (
              <div className="text-red-500 text-sm mt-1">{errors.position}</div>
            )}
          </div>
          <div>
            <label className="block text-black   font-semibold mb-1">
              Salary ($ per year)
            </label>
            <input
              type="number"
              className="w-full text-black    border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.salary}
              onChange={(e) =>
                setForm((f) => ({ ...f, salary: e.target.value }))
              }
            />
            {errors.salary && (
              <div className="text-red-500 text-sm mt-1">{errors.salary}</div>
            )}
          </div>
          <div>
            <label className="block text-black   font-semibold mb-1">
              Department
            </label>
            <select
              className="w-full text-black    border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && (
              <div className="text-red-500 text-sm mt-1">
                {errors.department}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full text-black   bg-blue-600 hover:bg-blue-700 font-semibold px-4 py-2 rounded shadow transition"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Employee"}
          </button>
          {error && (
            <div className="text-red-500 text-sm mt-2">{error.message}</div>
          )}
        </form>
      </div>
    </div>
  );
}


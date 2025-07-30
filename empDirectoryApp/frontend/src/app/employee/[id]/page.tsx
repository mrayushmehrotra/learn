"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEE_BY_ID } from "../../../../graphql/query/employee";
import { useEffect } from "react";

export default function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data, loading, error } = useQuery(GET_EMPLOYEE_BY_ID, {
    variables: { id: params.id },
  });
  useEffect(() => {
    alert(data.getEmployeeDetails.name);
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-lg font-semibold animate-pulse">Loading...</span>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-red-500 font-semibold">
          Error: {error.message}
        </span>
      </div>
    );
  if (!data?.getEmployeeDetails)
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500">Employee not found.</span>
      </div>
    );

  const emp = data.getEmployeeDetails;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white text-black rounded-xl shadow-lg p-8">
        <button
          className="mb-6 text-blue-600 hover:underline font-semibold"
          onClick={() => router.push("/")}
        >
          &larr; Back to Home
        </button>
        <h1 className="text-2xl font-bold text-blue-700 mb-4">
          Employee Details
        </h1>
        <div className="space-y-3">
          <div>
            <span className="font-semibold">Name:</span> {emp.name}
          </div>
          <div>
            <span className="font-semibold">Position:</span> {emp.position}
          </div>
          <div>
            <span className="font-semibold">Department:</span> {emp.department}
          </div>
          <div>
            <span className="font-semibold">Salary:</span> ${emp.salary}
          </div>
          <div>
            <span className="font-semibold">ID:</span> {emp.id}
          </div>
        </div>
      </div>
    </div>
  );
}

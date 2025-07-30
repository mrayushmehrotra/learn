"use client"
import { useQuery } from "@apollo/client";
import { GET_EMPLOYEES } from "../../graphql/query/employee";
import { GET_DEPARTMENTS } from "../../graphql/query/department";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Page() {

  const { data, loading, error } = useQuery(GET_EMPLOYEES);
  const { data: deptData } = useQuery(GET_DEPARTMENTS);
  const [selectedDept, setSelectedDept] = useState<string>("");

  if (loading) return <div className="flex items-center justify-center h-screen"><span className="text-lg font-semibold animate-pulse">Loading...</span></div>;
  if (error) return <div className="flex items-center justify-center h-screen"><span className="text-red-500 font-semibold">Error: {error.message}</span></div>;

  // Get unique departments for dropdown
  const departments: string[] = Array.from(new Set((deptData?.Employee || []).map((e: any) => e.department))).filter(Boolean) as string[];

  // Filter employees by department
  const employees = selectedDept
    ? data.Employee.filter((emp: any) => emp.department === selectedDept)
    : data.Employee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-6 px-2 sm:py-10 sm:px-4">
      <div className="max-w-4xl mx-auto bg-white text-black rounded-xl shadow-lg p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-700">Employees</h1>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
            <select
              className="border text-black border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept: string) => (
                <option className="text-black" key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <Link href="/employee/new" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition">Add New Employee</button>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-blue-100 rounded-lg text-sm sm:text-base">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="py-2 px-2 sm:px-4 text-left">Name</th>
                <th className="py-2 px-2 sm:px-4 text-left">Position</th>
                <th className="py-2 px-2 sm:px-4 text-left">Department</th>
                <th className="py-2 px-2 sm:px-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp: any) => (
                <tr key={emp.id} className="border-t border-blue-50 hover:bg-blue-50 transition">
                  <td className="py-2 px-2 sm:px-4 font-semibold text-blue-900 break-words max-w-[120px] sm:max-w-none">{emp.name}</td>
                  <td className="py-2 px-2 sm:px-4 text-black break-words max-w-[120px] sm:max-w-none">{emp.position}</td>
                  <td className="py-2 px-2 sm:px-4 text-black break-words max-w-[120px] sm:max-w-none">{emp.department}</td>
                  <td className="py-2 px-2 sm:px-4">
                    <Link href={`/employee/${emp.id}`} className="text-blue-600 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
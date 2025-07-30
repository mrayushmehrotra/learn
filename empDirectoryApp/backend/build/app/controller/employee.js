"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployeesByDepartment = exports.getAllEmp = exports.createEmployee = exports.getEmployeeDetails = void 0;
const dbOperations_1 = require("../../db/dbOperations");
const employeeValidation_1 = require("../../validations/employeeValidation");
const getEmployeeDetails = (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { id }) {
    try {
        // Validate ID input
        const validation = employeeValidation_1.idSchema.safeParse({ id });
        if (!validation.success) {
            const errors = (0, employeeValidation_1.formatZodError)(validation.error);
            throw new Error(`Invalid ID: ${errors}`);
        }
        const Employee = (0, dbOperations_1.getEmployee)();
        const count = 0;
        const employee = yield Employee.findById(id);
        // count patch { count++ }
        if (!employee) {
            throw new Error(`Employee with ID '${id}' not found`);
        }
        return {
            id: employee._id,
            name: employee.name,
            position: employee.position,
            salary: employee.salary.toString(),
            department: employee.department,
            departmentId: employee._id,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to get employee details: ${errorMessage}`);
    }
});
exports.getEmployeeDetails = getEmployeeDetails;
const createEmployee = (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { input }) {
    try {
        // Validate input with Zod
        const validationResult = employeeValidation_1.createEmployeeInputSchema.safeParse({ input });
        if (!validationResult.success) {
            const errors = (0, employeeValidation_1.formatZodError)(validationResult.error);
            throw new Error(`Validation failed: error`);
        }
        const validatedInput = validationResult.data.input;
        const Employee = (0, dbOperations_1.getEmployee)();
        // Check if employee name already exists
        const existingEmployee = yield Employee.findByName(validatedInput.name);
        if (existingEmployee) {
            throw new Error(`Employee with name '${validatedInput.name}' already exists, name must be unique`);
        }
        // Create the employee with the department enum value
        const employee = yield Employee.create({
            name: validatedInput.name,
            position: validatedInput.position,
            salary: validatedInput.salary,
            department: validatedInput.department,
            count: 0,
        });
        // Return the employee
        return {
            id: employee._id,
            name: employee.name,
            position: employee.position,
            salary: employee.salary.toString(),
            department: employee.department,
            departmentId: employee._id,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to create employee: ${errorMessage}`);
    }
});
exports.createEmployee = createEmployee;
const getAllEmp = () => __awaiter(void 0, void 0, void 0, function* () {
    const Employee = (0, dbOperations_1.getEmployee)();
    const users = yield Employee.findMany();
    return users.map((user) => ({
        id: user._id,
        name: user.name,
        position: user.position,
        salary: user.salary.toString(),
        department: user.department,
        departmentId: user._id,
    }));
});
exports.getAllEmp = getAllEmp;
// Department validation schema for query
const departmentQuerySchema = employeeValidation_1.z.object({
    department: employeeValidation_1.z.enum([
        "Sales",
        "Marketing",
        "Engineering",
        "Human Resources",
        "Finance",
    ]),
});
const getEmployeesByDepartment = (_1, _a) => __awaiter(void 0, [_1, _a], void 0, function* (_, { department }) {
    try {
        // Validate department input
        const validation = departmentQuerySchema.safeParse({ department });
        if (!validation.success) {
            const errors = (0, employeeValidation_1.formatZodError)(validation.error);
            throw new Error(`Invalid department: ${errors}`);
        }
        const Employee = (0, dbOperations_1.getEmployee)();
        const employees = yield Employee.findByDepartment(department);
        if (!employees || employees.length === 0) {
            return []; // Return empty array if no employees found in department
        }
        return employees.map((employee) => ({
            id: employee._id,
            name: employee.name,
            position: employee.position,
            salary: employee.salary.toString(),
            department: employee.department,
            departmentId: employee._id,
        }));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new Error(`Failed to get employees by department: ${errorMessage}`);
    }
});
exports.getEmployeesByDepartment = getEmployeesByDepartment;

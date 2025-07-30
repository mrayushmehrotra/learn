"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.formatZodError = exports.idSchema = exports.updateEmployeeSchema = exports.createEmployeeInputSchema = exports.employeeSchema = exports.departmentSchema = void 0;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
// Department validation schema
exports.departmentSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "Department name is required")
        .max(50, "Department name too long"),
    floor: zod_1.z
        .number()
        .int()
        .min(1, "Floor must be at least 1")
        .max(100, "Floor number too high")
        .optional(),
});
// Employee validation schema
exports.employeeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, "Employee name is required")
        .max(50, "Employee name too long")
        .regex(/^[a-zA-Z0-9_]+$/, "Name must contain only letters, numbers, and underscores"),
    position: zod_1.z
        .string()
        .min(1, "Position is required")
        .max(100, "Position description too long"),
    salary: zod_1.z
        .number()
        .int()
        .min(0, "Salary must be non-negative")
        .max(1000000, "Salary too high"),
    department: zod_1.z.enum([
        "Sales",
        "Marketing",
        "Engineering",
        "Human Resources",
        "Finance",
    ]),
    floor: zod_1.z.number().int().min(1).max(100).optional(),
});
// Create employee input validation
exports.createEmployeeInputSchema = zod_1.z.object({
    input: exports.employeeSchema,
});
// Update employee validation (all fields optional)
exports.updateEmployeeSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-zA-Z0-9_]+$/)
        .optional(),
    position: zod_1.z.string().min(1).max(100).optional(),
    salary: zod_1.z.number().int().min(0).max(1000000).optional(),
    department: zod_1.z
        .enum(["Sales", "Marketing", "Engineering", "Human Resources", "Finance"])
        .optional(),
    floor: zod_1.z.number().int().min(1).max(100).optional(),
});
// ID validation
exports.idSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "ID is required"),
});
// Helper function to format Zod errors
const formatZodError = (error) => {
    return error;
};
exports.formatZodError = formatZodError;

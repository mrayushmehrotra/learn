import { z } from "zod";

// Department validation schema
export const departmentSchema = z.object({
  name: z
    .string()
    .min(1, "Department name is required")
    .max(50, "Department name too long"),
  floor: z
    .number()
    .int()
    .min(1, "Floor must be at least 1")
    .max(100, "Floor number too high")
    .optional(),
});

// Employee validation schema
export const employeeSchema = z.object({
  name: z
    .string()
    .min(1, "Employee name is required")
    .max(50, "Employee name too long")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Name must contain only letters, numbers, and underscores",
    ),
  position: z
    .string()
    .min(1, "Position is required")
    .max(100, "Position description too long"),
  salary: z
    .number()
    .int()
    .min(0, "Salary must be non-negative")
    .max(1000000, "Salary too high"),
  department: z.enum([
    "Sales",
    "Marketing",
    "Engineering",
    "Human Resources",
    "Finance",
  ]),
  floor: z.number().int().min(1).max(100).optional(),
});

// Create employee input validation
export const createEmployeeInputSchema = z.object({
  input: employeeSchema,
});

// Update employee validation (all fields optional)
export const updateEmployeeSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  position: z.string().min(1).max(100).optional(),
  salary: z.number().int().min(0).max(1000000).optional(),
  department: z
    .enum(["Sales", "Marketing", "Engineering", "Human Resources", "Finance"])
    .optional(),
  floor: z.number().int().min(1).max(100).optional(),
});

// ID validation
export const idSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

// Helper function to format Zod errors
export const formatZodError = (error: z.ZodError) => {
  return error;
};

// Export z for use in other files
export { z };


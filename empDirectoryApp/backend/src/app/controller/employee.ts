import { EmployeeOperations, getEmployee } from "../../db/dbOperations";
import {
  createEmployeeInputSchema,
  formatZodError,
  idSchema,
  z,
} from "../../validations/employeeValidation";

interface GetEmployeeDetailsArgs {
  id: string;
}

export const getEmployeeDetails = async (
  _: any,
  { id }: GetEmployeeDetailsArgs,
) => {
  try {
    // Validate ID input
    const validation = idSchema.safeParse({ id });
    if (!validation.success) {
      const errors = formatZodError(validation.error);
      throw new Error(`Invalid ID: ${errors}`);
    }

    const Employee = getEmployee();
    const count = 0;

    const employee = await Employee.findById(id);
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to get employee details: ${errorMessage}`);
  }
};

interface CreateEmployeeInput {
  name: string;
  position: string;
  salary: number;
  department: string;
  floor?: number;
}

interface ResolverArgs {
  input: CreateEmployeeInput;
}

export const createEmployee = async (_: any, { input }: ResolverArgs) => {
  try {
    // Validate input with Zod
    const validationResult = createEmployeeInputSchema.safeParse({ input });

    if (!validationResult.success) {
      const errors = formatZodError(validationResult.error);
      throw new Error(`Validation failed: error`);
    }

    const validatedInput = validationResult.data.input;

    const Employee = getEmployee();

    // Check if employee name already exists
    const existingEmployee = await Employee.findByName(validatedInput.name);
    if (existingEmployee) {
      throw new Error(
        `Employee with name '${validatedInput.name}' already exists, name must be unique`,
      );
    }

    // Create the employee with the department enum value
    const employee = await Employee.create({
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
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to create employee: ${errorMessage}`);
  }
};

export const getAllEmp = async () => {
  const Employee = getEmployee();
  const users = await Employee.findMany();
  return users.map((user) => ({
    id: user._id,
    name: user.name,
    position: user.position,
    salary: user.salary.toString(),
    department: user.department,
    departmentId: user._id,
  }));
};

// Department validation schema for query
const departmentQuerySchema = z.object({
  department: z.enum([
    "Sales",
    "Marketing",
    "Engineering",
    "Human Resources",
    "Finance",
  ]),
});

interface GetEmployeesByDepartmentArgs {
  department: string;
}

export const getEmployeesByDepartment = async (
  _: any,
  { department }: GetEmployeesByDepartmentArgs,
) => {
  try {
    // Validate department input
    const validation = departmentQuerySchema.safeParse({ department });
    if (!validation.success) {
      const errors = formatZodError(validation.error);
      throw new Error(`Invalid department: ${errors}`);
    }

    const Employee = getEmployee();
    const employees = await Employee.findByDepartment(department);

    if (!employees || employees.length === 0) {
      return []; // Return empty array if no employees found in department
    }

    return employees.map((employee: any) => ({
      id: employee._id,
      name: employee.name,
      position: employee.position,
      salary: employee.salary.toString(),
      department: employee.department,
      departmentId: employee._id,
    }));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to get employees by department: ${errorMessage}`);
  }
};

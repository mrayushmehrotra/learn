import { employeeSchema, departmentSchema, formatZodError } from "../validations/employeeValidation";
import { connectDB } from "./dbConnection";
import dotenv from "dotenv";
import { getEmployee, getDepartment } from "./dbOperations";


// Load environment variables
dotenv.config();

const demoData = {
  departments: [
    {
      name: "Engineering",
      floor: 3
    },
    {
      name: "Marketing",
      floor: 2
    },
    {
      name: "Sales",
      floor: 1
    },
    {
      name: "Human Resources",
      floor: 4
    },
    {
      name: "Finance",
      floor: 5
    }
  ],
  employees: [
    {
      name: "john_doe",
      position: "Senior Software Engineer",
      salary: 95000,
      department: "Engineering"
    },
    {
      name: "jane_smith",
      position: "Frontend Developer",
      salary: 85000,
      department: "Engineering"
    },
    {
      name: "mike_johnson",
      position: "Marketing Manager",
      salary: 75000,
      department: "Marketing"
    },
    {
      name: "sarah_wilson",
      position: "Sales Representative",
      salary: 65000,
      department: "Sales"
    },
    {
      name: "david_brown",
      position: "HR Specialist",
      salary: 70000,
      department: "Human Resources"
    },
    {
      name: "lisa_davis",
      position: "Financial Analyst",
      salary: 80000,
      department: "Finance"
    },
    {
      name: "alex_chen",
      position: "Backend Developer",
      salary: 90000,
      department: "Engineering"
    },
    {
      name: "emma_taylor",
      position: "Marketing Coordinator",
      salary: 60000,
      department: "Marketing"
    },
    {
      name: "tom_anderson",
      position: "Sales Manager",
      salary: 85000,
      department: "Sales"
    },
    {
      name: "rachel_green",
      position: "HR Manager",
      salary: 90000,
      department: "Human Resources"
    },
    {
      name: "james_wilson",
      position: "Finance Manager",
      salary: 95000,
      department: "Finance"
    }
  ]
};

export const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding with validation...");

    // Connect to database first
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not found in environment variables");
    }

    console.log("🔌 Connecting to database...");
    await connectDB(databaseUrl);
    console.log("✅ Database connected successfully");

    // Get database operation instances

    const Employee = getEmployee();
    const Department = getDepartment();

    // Clear existing data
    await Employee.deleteMany({});
    await Department.deleteMany({});
    console.log("🗑️  Cleared existing data");

    // Validate and create departments
    const validatedDepartments = [];
    for (const deptData of demoData.departments) {
      const validation = departmentSchema.safeParse(deptData);
      if (!validation.success) {
        const errors = formatZodError(validation.error);
        console.error(`❌ Department validation failed for ${deptData.name}:`, errors);
        continue;
      }
      validatedDepartments.push(validation.data);
    }

    if (validatedDepartments.length === 0) {
      throw new Error("No valid departments found after validation");
    }

    // Ensure floor is always a number for TypeScript
    const departmentsWithFloor = validatedDepartments.map(dept => ({
      name: dept.name,
      floor: dept.floor || 1
    }));

    const createdDepartments = await Department.insertMany(departmentsWithFloor);
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // Validate and create employees
    const employeePromises = demoData.employees.map(async (empData) => {
      const validation = employeeSchema.safeParse(empData);
      if (!validation.success) {
        const errors = formatZodError(validation.error);
        console.error(`❌ Employee validation failed for ${empData.name}:`, errors);
        return null;
      }

      const validatedEmpData = validation.data;

      // Check if employee name already exists (shouldn't happen in seeding, but good practice)
      const existingEmployee = await Employee.findByName(validatedEmpData.name);
      if (existingEmployee) {
        console.error(`❌ Employee with name '${validatedEmpData.name}' already exists, skipping`);
        return null;
      }

      const employee = await Employee.create({
        name: validatedEmpData.name,
        position: validatedEmpData.position,
        salary: validatedEmpData.salary,
        department: validatedEmpData.department
      });

      return employee;
    });

    const createdEmployees = (await Promise.all(employeePromises)).filter(Boolean);
    console.log(`✅ Created ${createdEmployees.length} employees`);

    console.log("🎉 Database seeding completed successfully!");
    
    // Log sample data
    console.log("\n📊 Sample Data Created:");
    console.log("Departments:", createdDepartments.map((d: any) => ({ id: d._id, name: d.name, floor: d.floor })));
    console.log("Employees:", createdEmployees.map((e: any) => ({ 
      id: e._id, 
      name: e.name, 
      position: e.position, 
      salary: e.salary,
      department: e.department 
    })));

    return {
      departments: createdDepartments.length,
      employees: createdEmployees.length
    };

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log(`✅ Seeding completed: ${result.departments} departments, ${result.employees} employees`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
} 
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const employeeValidation_1 = require("../validations/employeeValidation");
const dbConnection_1 = require("./dbConnection");
const dotenv_1 = __importDefault(require("dotenv"));
const dbOperations_1 = require("./dbOperations");
// Load environment variables
dotenv_1.default.config();
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
const seedDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("🌱 Starting database seeding with validation...");
        // Connect to database first
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error("DATABASE_URL not found in environment variables");
        }
        console.log("🔌 Connecting to database...");
        yield (0, dbConnection_1.connectDB)(databaseUrl);
        console.log("✅ Database connected successfully");
        // Get database operation instances
        const Employee = (0, dbOperations_1.getEmployee)();
        const Department = (0, dbOperations_1.getDepartment)();
        // Clear existing data
        yield Employee.deleteMany({});
        yield Department.deleteMany({});
        console.log("🗑️  Cleared existing data");
        // Validate and create departments
        const validatedDepartments = [];
        for (const deptData of demoData.departments) {
            const validation = employeeValidation_1.departmentSchema.safeParse(deptData);
            if (!validation.success) {
                const errors = (0, employeeValidation_1.formatZodError)(validation.error);
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
        const createdDepartments = yield Department.insertMany(departmentsWithFloor);
        console.log(`✅ Created ${createdDepartments.length} departments`);
        // Validate and create employees
        const employeePromises = demoData.employees.map((empData) => __awaiter(void 0, void 0, void 0, function* () {
            const validation = employeeValidation_1.employeeSchema.safeParse(empData);
            if (!validation.success) {
                const errors = (0, employeeValidation_1.formatZodError)(validation.error);
                console.error(`❌ Employee validation failed for ${empData.name}:`, errors);
                return null;
            }
            const validatedEmpData = validation.data;
            // Check if employee name already exists (shouldn't happen in seeding, but good practice)
            const existingEmployee = yield Employee.findByName(validatedEmpData.name);
            if (existingEmployee) {
                console.error(`❌ Employee with name '${validatedEmpData.name}' already exists, skipping`);
                return null;
            }
            const employee = yield Employee.create({
                name: validatedEmpData.name,
                position: validatedEmpData.position,
                salary: validatedEmpData.salary,
                department: validatedEmpData.department
            });
            return employee;
        }));
        const createdEmployees = (yield Promise.all(employeePromises)).filter(Boolean);
        console.log(`✅ Created ${createdEmployees.length} employees`);
        console.log("🎉 Database seeding completed successfully!");
        // Log sample data
        console.log("\n📊 Sample Data Created:");
        console.log("Departments:", createdDepartments.map((d) => ({ id: d._id, name: d.name, floor: d.floor })));
        console.log("Employees:", createdEmployees.map((e) => ({
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
    }
    catch (error) {
        console.error("❌ Error seeding database:", error);
        throw error;
    }
});
exports.seedDatabase = seedDatabase;
// Run seeding if this file is executed directly
if (require.main === module) {
    (0, exports.seedDatabase)()
        .then((result) => {
        console.log(`✅ Seeding completed: ${result.departments} departments, ${result.employees} employees`);
        process.exit(0);
    })
        .catch((error) => {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    });
}

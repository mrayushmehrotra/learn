import { Collection, ObjectId } from "mongodb";
import { getDB, isConnected } from "./dbConnection";

// Types for our data
export interface Department {
  _id?: ObjectId;
  name: string;
  floor: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  _id?: ObjectId;
  name: string;
  position: string;
  salary: number;
  department: string;
  createdAt?: Date;
  updatedAt?: Date;
  views: number;
}

// Database operations
export class DepartmentOperations {
  private collection: Collection<Department>;

  constructor() {
    this.collection = getDB().collection<Department>("departments");
  }

  async create(department: Omit<Department, "_id">): Promise<Department> {
    const now = new Date();
    const newDepartment: Department = {
      ...department,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(newDepartment);
    return { ...newDepartment, _id: result.insertedId };
  }

  async findByName(name: string): Promise<Department | null> {
    return await this.collection.findOne({ name });
  }

  async findMany(filter: any = {}): Promise<Department[]> {
    return await this.collection.find(filter).toArray();
  }

  async insertMany(
    departments: Omit<Department, "_id">[],
  ): Promise<Department[]> {
    const now = new Date();
    const departmentsWithTimestamps = departments.map((dept) => ({
      ...dept,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await this.collection.insertMany(departmentsWithTimestamps);
    return departmentsWithTimestamps.map((dept, index) => ({
      ...dept,
      _id: result.insertedIds[index],
    }));
  }

  async deleteMany(filter: any = {}): Promise<void> {
    await this.collection.deleteMany(filter);
  }
}

export class EmployeeOperations {
  private collection: Collection<Employee>;

  constructor() {
    this.collection = getDB().collection<Employee>("employees");
  }

  async create(employee: Omit<Employee, "_id">): Promise<Employee> {
    const now = new Date();
    const newEmployee: Employee = {
      ...employee,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(newEmployee);
    return { ...newEmployee, _id: result.insertedId };
  }

  async findById(id: string): Promise<Employee | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findByName(name: string): Promise<Employee | null> {
    return await this.collection.findOne({ name });
  }

  async findMany(filter: any = {}): Promise<Employee[]> {
    return await this.collection.find(filter).toArray();
  }

  async findByDepartment(department: string): Promise<Employee[]> {
    return await this.collection.find({ department }).toArray();
  }

  async insertMany(employees: Omit<Employee, "_id">[]): Promise<Employee[]> {
    const now = new Date();
    const employeesWithTimestamps = employees.map((emp) => ({
      ...emp,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await this.collection.insertMany(employeesWithTimestamps);
    return employeesWithTimestamps.map((emp, index) => ({
      ...emp,
      _id: result.insertedIds[index],
    }));
  }

  async deleteMany(filter: any = {}): Promise<void> {
    await this.collection.deleteMany(filter);
  }
}

// Factory functions to get instances
export const getDepartment = (): DepartmentOperations => {
  if (!isConnected()) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return new DepartmentOperations();
};

export const getEmployee = (): EmployeeOperations => {
  if (!isConnected()) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return new EmployeeOperations();
};


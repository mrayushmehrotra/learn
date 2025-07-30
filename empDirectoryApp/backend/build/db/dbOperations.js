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
exports.getEmployee = exports.getDepartment = exports.EmployeeOperations = exports.DepartmentOperations = void 0;
const mongodb_1 = require("mongodb");
const dbConnection_1 = require("./dbConnection");
// Database operations
class DepartmentOperations {
    constructor() {
        this.collection = (0, dbConnection_1.getDB)().collection("departments");
    }
    create(department) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const newDepartment = Object.assign(Object.assign({}, department), { createdAt: now, updatedAt: now });
            const result = yield this.collection.insertOne(newDepartment);
            return Object.assign(Object.assign({}, newDepartment), { _id: result.insertedId });
        });
    }
    findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findOne({ name });
        });
    }
    findMany() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield this.collection.find(filter).toArray();
        });
    }
    insertMany(departments) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const departmentsWithTimestamps = departments.map((dept) => (Object.assign(Object.assign({}, dept), { createdAt: now, updatedAt: now })));
            const result = yield this.collection.insertMany(departmentsWithTimestamps);
            return departmentsWithTimestamps.map((dept, index) => (Object.assign(Object.assign({}, dept), { _id: result.insertedIds[index] })));
        });
    }
    deleteMany() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            yield this.collection.deleteMany(filter);
        });
    }
}
exports.DepartmentOperations = DepartmentOperations;
class EmployeeOperations {
    constructor() {
        this.collection = (0, dbConnection_1.getDB)().collection("employees");
    }
    create(employee) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const newEmployee = Object.assign(Object.assign({}, employee), { createdAt: now, updatedAt: now });
            const result = yield this.collection.insertOne(newEmployee);
            return Object.assign(Object.assign({}, newEmployee), { _id: result.insertedId });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findOne({ _id: new mongodb_1.ObjectId(id) });
        });
    }
    findByName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findOne({ name });
        });
    }
    findMany() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            return yield this.collection.find(filter).toArray();
        });
    }
    findByDepartment(department) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.find({ department }).toArray();
        });
    }
    insertMany(employees) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const employeesWithTimestamps = employees.map((emp) => (Object.assign(Object.assign({}, emp), { createdAt: now, updatedAt: now })));
            const result = yield this.collection.insertMany(employeesWithTimestamps);
            return employeesWithTimestamps.map((emp, index) => (Object.assign(Object.assign({}, emp), { _id: result.insertedIds[index] })));
        });
    }
    deleteMany() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            yield this.collection.deleteMany(filter);
        });
    }
}
exports.EmployeeOperations = EmployeeOperations;
// Factory functions to get instances
const getDepartment = () => {
    if (!(0, dbConnection_1.isConnected)()) {
        throw new Error("Database not connected. Call connectDB first.");
    }
    return new DepartmentOperations();
};
exports.getDepartment = getDepartment;
const getEmployee = () => {
    if (!(0, dbConnection_1.isConnected)()) {
        throw new Error("Database not connected. Call connectDB first.");
    }
    return new EmployeeOperations();
};
exports.getEmployee = getEmployee;

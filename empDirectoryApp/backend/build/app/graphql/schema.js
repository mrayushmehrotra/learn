"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
exports.schema = `#graphql 

input CreateEmployeeInput {
  name: String!
  position: String!
  salary: Int!
  department: String!
  floor: Int
}
 
input IncreaseView {
count: Int!
}

type Employee{
id: ID!
name: String 
position: String 
salary: String 
department: String 
departmentId: ID!
}

type Query {
Employee: [Employee]
getEmployeeDetails(id: ID!): Employee
getEmployeesByDepartment(department: String!): [Employee]
}

type Mutation {
  createEmployee(input: CreateEmployeeInput!): Employee!
}


`;

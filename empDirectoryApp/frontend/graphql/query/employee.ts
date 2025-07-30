import { gql } from "@apollo/client";

export const GET_EMPLOYEE_BY_ID = gql`
  query GetEmployeeDetails($id: ID!) {
    getEmployeeDetails(id: $id) {
      id
      name
      position
      salary
      department
      departmentId
    }
  }
`;
export const GET_EMPLOYEES = gql`
  query {
    Employee {
      id
      name
      position
      salary
      department
    }
  }
`;

export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: CreateEmployeeInput!) {
    createEmployee(input: $input) {
      id
      name
      position
      salary
      department
      departmentId
    }
  }
`;


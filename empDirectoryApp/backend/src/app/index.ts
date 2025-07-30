import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import cors from "cors";

import { schema } from "./graphql/schema";
import {
  getEmployeeDetails,
  getEmployeesByDepartment,
  getAllEmp,
  createEmployee,
} from "./controller/employee";

export async function initServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const graphqlServer = new ApolloServer({
    typeDefs: schema,

    resolvers: {
      Query: {
        Employee: getAllEmp,
        getEmployeeDetails,
        getEmployeesByDepartment,
      },
      Mutation: {
        createEmployee,
      },
    },
  });

  await graphqlServer.start();

  app.use("/graphql", expressMiddleware(graphqlServer));
  return app;
}

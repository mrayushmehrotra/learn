#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

class UsersServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "users-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_users",
          description: "Fetch all users from DummyJSON API",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_user",
          description: "Fetch a specific user by ID",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "number",
                description: "User ID to fetch",
              },
            },
            required: ["id"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_users":
            return await this.getUsers();
          case "get_user":
            return await this.getUser(args?.id as number);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async getUsers() {
    const response = await axios.get("https://dummyjson.com/users");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getUser(id: number) {
    if (!id) {
      throw new Error("User ID is required");
    }
    const response = await axios.get(`https://dummyjson.com/users/${id}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Users MCP server running on stdio");
  }
}

const server = new UsersServer();
server.run().catch(console.error);

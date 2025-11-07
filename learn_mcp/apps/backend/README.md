# Users MCP Server

A Model Context Protocol (MCP) server that provides tools to fetch user data from the DummyJSON API.

## What is MCP?

Model Context Protocol (MCP) is an open standard that enables AI assistants to securely connect to external data sources and tools. This server exposes user data through standardized MCP tools.

## Available Tools

- `get_users` - Fetch all users from DummyJSON API
- `get_user` - Fetch a specific user by ID

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector tsx index.ts
```

## Integration with AI Clients

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "users": {
      "command": "node",
      "args": ["/path/to/this/server/dist/index.js"]
    }
  }
}
```

## Industry Standards

This server follows MCP best practices:
- Uses stdio transport for communication
- Implements proper error handling
- Provides structured tool schemas
- Returns standardized content responses
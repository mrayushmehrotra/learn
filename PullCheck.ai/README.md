# PullCheck - Automated Code Review Bot

🤖 AI-powered code review bot that integrates with GitHub pull requests using Claude API.

## Features

- 🔐 **GitHub OAuth** - Secure authentication with GitHub
- 🔗 **Webhook Integration** - Automatic PR detection and review
- 🤖 **AI Code Review** - Powered by Claude API for intelligent feedback
- 📊 **Dashboard** - View review history and metrics
- ✏️ **Override Comments** - Manual control over AI suggestions
- 🔒 **Security First** - Token encryption, rate limiting, HMAC verification

## Tech Stack

### Backend
- **Node.js 20+** with **Express.js**
- **TypeScript** with strict mode
- **MongoDB + Mongoose** for data persistence
- **Cluster Module** for multi-core scaling
- **SOLID Principles** architecture
- **Zod** for validation
- **Winston** for logging

### Frontend
- **React 19** with **Vite**
- **TypeScript** with strict mode
- **TanStack Query** for server state
- **Zustand** for client state
- **React Router v6** for routing
- **Axios** for HTTP client

## Project Structure

```
PullCheck.ai/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API service layer
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # Configuration & database
│   │   ├── modules/           # Feature modules (SOLID)
│   │   │   ├── auth/          # Authentication
│   │   │   ├── users/         # User management
│   │   │   ├── reviews/       # Code reviews
│   │   │   └── webhooks/      # GitHub webhooks
│   │   ├── integrations/      # Third-party services
│   │   │   ├── github/        # GitHub API (Octokit)
│   │   │   └── claude/        # Claude AI API
│   │   ├── shared/            # Shared utilities
│   │   ├── server.ts          # Express app
│   │   ├── cluster.ts         # Cluster entry
│   │   └── index.ts           # Single-process entry
│   └── package.json
│
└── context.md                 # Project specification
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- GitHub OAuth App
- Anthropic API Key

### 1. Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd PullCheck.ai

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your credentials
```

Required environment variables:
- `GITHUB_CLIENT_ID` - From GitHub OAuth App
- `GITHUB_CLIENT_SECRET` - From GitHub OAuth App
- `GITHUB_WEBHOOK_SECRET` - Secret for webhook verification
- `ANTHROPIC_API_KEY` - Claude API key
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - 32+ character secret
- `ENCRYPTION_KEY` - 32+ character key for token encryption

### 3. Create GitHub OAuth App

1. Go to GitHub → Settings → Developer Settings → OAuth Apps
2. Create new OAuth App:
   - Application name: `PullCheck` (or your choice)
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:3000/api/v1/auth/github/callback`
3. Copy Client ID and Client Secret to `.env`

### 4. Run Development Servers

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API: http://localhost:3000/api/v1

### 5. Set Up Webhook (for local development)

Use [smee.io](https://smee.io) to proxy webhooks locally:

```bash
# Install smee client
npm install -g smee-client

# Create a channel at smee.io and run:
smee -u <your-smee-url> -t http://localhost:3000/api/v1/webhooks/github
```

## API Endpoints

### Authentication
- `GET /api/v1/auth/github` - Initiate OAuth
- `GET /api/v1/auth/github/callback` - OAuth callback
- `GET /api/v1/auth/me` - Current user
- `POST /api/v1/auth/logout` - Logout

### Reviews
- `GET /api/v1/reviews` - List reviews
- `GET /api/v1/reviews/:id` - Get review
- `POST /api/v1/reviews/:id/override` - Override comments
- `POST /api/v1/reviews/:id/rerun` - Re-run review
- `DELETE /api/v1/reviews/:id` - Delete review

### Users
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me/settings` - Update settings
- `POST /api/v1/users/me/repos` - Connect repository
- `DELETE /api/v1/users/me/repos/:repoId` - Disconnect repository

### Webhooks
- `POST /api/v1/webhooks/github` - GitHub webhook receiver

## Architecture Highlights

### SOLID Principles

- **Single Responsibility**: Each module (controller, service, repository) has one job
- **Open/Closed**: Strategy pattern for AI providers (Claude, future GPT support)
- **Liskov Substitution**: Interface-based design
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Constructor injection, depend on abstractions

### Cluster Module

The backend uses Node.js cluster module to utilize all CPU cores:

```bash
# Production - uses all cores
npm start

# Development - single process
npm run dev
```

### Security

- JWT authentication with expiration
- Token encryption at rest (AES-256-GCM)
- Webhook signature verification (HMAC-SHA256)
- Rate limiting on API endpoints
- Helmet security headers
- CORS configuration

## Scripts

### Server
```bash
npm run dev          # Development (single process)
npm run dev:cluster  # Development (cluster mode)
npm run build        # Build TypeScript
npm start            # Production (cluster mode)
npm test             # Run tests
```

### Client
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## License

MIT

# Automated Code Review Bot Integration – Project Context

## Overview

This project implements an **Automated Code Review Bot** integrated with GitHub pull requests. The system analyzes code diffs using an LLM (Claude API), posts automated review comments on PRs, and provides a React-based dashboard for visibility, summaries, and manual overrides.

The goal is to demonstrate end-to-end MERN stack capability: OAuth, webhooks, background processing, third‑party APIs, and a clean developer UX.

---

## Core Objectives

* Authenticate users with GitHub and authorize repository access
* Listen to GitHub webhook events (Pull Request opened/synchronized)
* Fetch PR diffs and metadata using GitHub API
* Run automated code review using Claude API
* Post structured review comments back to GitHub PRs
* Store review history and metadata in MongoDB
* Provide a dashboard to view summaries and manually override comments

---

## Tech Stack

### Frontend

* **React.js** (Vite or CRA)
* **GitHub OAuth** (via backend)
* **Axios / Fetch** for API calls
* UI: minimal dashboard (PR list, review summary, override editor)

### Backend

* **Node.js + Express.js**
* **GitHub OAuth & Webhooks**
* **Octokit** (GitHub API client)
* **Claude API** (LLM-based code review)
* **MongoDB + Mongoose**

---

## High-Level Architecture

```
GitHub PR Event
      ↓ (Webhook)
Backend (Express)
  ├─ Verify Webhook Signature
  ├─ Fetch PR Diff (Octokit)
  ├─ Send Diff to Claude API
  ├─ Parse Review Feedback
  ├─ Store Review (MongoDB)
  └─ Post Comments to GitHub PR
      ↓
React Dashboard (View + Override)
```

---

## Key Features

### 1. GitHub Authentication

* OAuth App configured in GitHub Developer Settings
* Scopes: `repo`, `read:user`, `pull_request`
* Access token stored securely (encrypted or short-lived)

### 2. Webhook Processing

* Webhook events handled:

  * `pull_request.opened`
  * `pull_request.synchronize`
* Signature validation using webhook secret

### 3. Automated Code Review

* PR diff is chunked to respect token limits
* Claude prompt focuses on:

  * Bugs & logic errors
  * Code quality & readability
  * Security concerns
  * Best practices
* Output normalized into:

  * Summary
  * File-level comments
  * Severity tags

### 4. GitHub PR Commenting

* Inline comments where possible
* Fallback to general PR comment
* Clearly marked as **Automated Review**

### 5. Dashboard (React)

* List connected repositories
* Recent PRs with review status
* Review summary view
* Manual override editor:

  * Edit or approve AI comments
  * Re-post updated feedback to GitHub

---

## Data Models (MongoDB)

### User

* githubId
* username
* accessToken (encrypted)
* connectedRepos[]

### PullRequestReview

* repoName
* prNumber
* commitSha
* summary
* comments[]
* status (pending | reviewed | overridden)
* createdAt

---

## API Endpoints (Backend)

### Auth

* `GET /auth/github`
* `GET /auth/github/callback`

### Webhooks

* `POST /webhooks/github`

### Reviews

* `GET /api/reviews`
* `GET /api/reviews/:id`
* `POST /api/reviews/:id/override`

---

## Environment Variables

```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
CLAUDE_API_KEY=
MONGO_URI=
APP_URL=
```

---

## Claude Prompt Strategy (Summary)

* System prompt enforces:

  * Concise, actionable feedback
  * No hallucinated context
  * File + line references
* User prompt includes:

  * PR title
  * PR description
  * Code diff

---

## Deliverables

* Public GitHub repository
* Clear README with setup instructions
* Demo Pull Request showing automated review comments
* Review summary visible in dashboard

---

## Non-Goals

* No CI/CD pipeline required
* No production-grade scaling
* No multi-LLM routing

---

## Time Constraint

* **Duration:** 4 days
* Focus on correctness, clarity, and clean architecture over polish

---

## Evaluation Criteria

* Correct webhook & OAuth implementation
* Quality of automated review output
* Clean, readable codebase
* Clear documentation and demo PR

---

*End of Context File*

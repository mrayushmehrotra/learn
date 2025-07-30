# Employee Directory Application

A full-stack employee directory built with Node.js, Apollo GraphQL, MongoDB, and Next.js (App Router). Features include employee listing, department filtering, detail view, and employee creation with validation. Fully responsive and styled with Tailwind CSS.

---

## 🚀 Features

- **Backend (Node.js, Apollo Server 4, MongoDB Driver)**
  - GraphQL API with queries and mutations
  - Employee and Department schema with relationships
  - Queries: getAllEmployees, getEmployeeDetails, getEmployeesByDepartment
  - Mutation: addEmployee
  - MongoDB native driver (no Mongoose)
  - Seed script for initial data
  - Robust error handling (invalid IDs, validation)

- **Frontend (Next.js, Apollo Client, Tailwind CSS)**
  - Home page: Employee table, department filter, add button
  - Employee detail page: All fields, back button
  - Add employee form: Validation, department dropdown
  - Responsive, mobile-friendly UI
  - Loading and error states for all operations

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Apollo Server 4, GraphQL, MongoDB (native driver)
- **Frontend:** Next.js (App Router), Apollo Client, React, Tailwind CSS
- **DevOps:** Docker, Docker Compose

---

## 📦 Project Structure

```
/ (root)
  /backend         # Node.js GraphQL API
  /frontend        # Next.js frontend
  docker-compose.yml
  /backend/Dockerfile       # Backend Dockerfile
  /frontend/Dockerfile
  README.md
```

---

## ⚡ Quick Start (with Docker Compose)

0. **Run the Server on Linux:**
   ```sh
   chmod +x run.sh
   ./run.sh
   ```


1. **Build and start all services with docker:**
   ```sh
   docker-compose up --build
   ```
2. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8000/graphql](http://localhost:8000/graphql)
   - MongoDB: [localhost:27017](mongodb://localhost:27017)

---

## 📝 Manual Setup (Local Dev)

### Backend
```sh
cd backend
npm install
npm run seed   # Seed initial data
npm run dev    # Start backend (default: http://localhost:8000)
```

### Frontend
```sh
cd frontend
npm install
npm run dev    # Start frontend (default: http://localhost:3000)
```

---

## 🔑 GraphQL API

- **getAllEmployees**: List all employees (name, position)
- **getEmployeeDetails(id)**: Get all fields for an employee
- **getEmployeesByDepartment(department)**: List employees by department
- **addEmployee(name, position, department, salary)**: Add a new employee

---

## 🖥️ UI Features
- **Home Page**: Table of employees, department filter, add button
- **Employee Detail**: All fields, back button
- **Add Employee**: Form with validation, department dropdown
- **Mobile Responsive**: Tailwind CSS, flex/table responsive
- **Loading/Error States**: User-friendly feedback

---

## ⚙️ Environment Variables

- **Backend:**
  - `DATABASE_URL` (e.g. `mongodb://localhost:27017/empDirectoryApp`)
- **Frontend:**
  - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` (e.g. `http://localhost:8000/graphql`)

---

## 🐳 Docker Compose Overview
- **mongo**: MongoDB database, persistent volume
- **backend**: Node.js GraphQL API, connects to MongoDB
- **frontend**: Next.js app, connects to backend

---

## 📚 Evaluation Criteria
- Complete functional implementation
- Clean component structure
- Efficient GraphQL queries
- Proper state management
- Error handling (frontend + backend)
- UI consistency

---

## 👨‍💻 Author & License
- **Author:** Your Name
- **License:** MIT

---

## 📬 Contact
For any questions or issues, please open an issue or contact the maintainer. 

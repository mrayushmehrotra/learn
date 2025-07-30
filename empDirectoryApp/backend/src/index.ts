import { initServer } from "./app";

import * as dotenv from "dotenv";
import { connectDB } from "./db/dbConnection";

dotenv.config();

const DB_URI = process.env.DATABASE_URL!

async function init() {
  try {
    // Connect to database first
    console.log("🔌 Connecting to database...");
    await connectDB(DB_URI);
    console.log("✅ Database connected successfully");

    // Initialize server after database connection
    const app = await initServer();
    app.listen(8000, () => {
      console.log("Server is on 8000");
    });
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  }
}

init();

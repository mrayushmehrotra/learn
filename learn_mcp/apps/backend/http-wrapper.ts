import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/users", async (req, res) => {
  try {
    const response = await axios.get("https://dummyjson.com/users");
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const response = await axios.get(`https://dummyjson.com/users/${id}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.listen(3001, () => {
  console.log("HTTP API running on http://localhost:3001");
});
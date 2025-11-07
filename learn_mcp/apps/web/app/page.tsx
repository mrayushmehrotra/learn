"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`);
      const user = await response.json();
      setSelectedUser(user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>MCP Users Demo</h1>
        
        <div className={styles.ctas}>
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? "Loading..." : "Fetch All Users"}
          </Button>
        </div>

        {users.length > 0 && (
          <div>
            <h2>Users ({users.length})</h2>
            <div style={{ display: "grid", gap: "10px", maxHeight: "300px", overflow: "auto" }}>
              {users.slice(0, 10).map((user) => (
                <div key={user.id} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
                  <strong>{user.firstName} {user.lastName}</strong>
                  <br />
                  <small>{user.email}</small>
                  <br />
                  <Button onClick={() => fetchUser(user.id)} style={{ marginTop: "5px" }}>
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedUser && (
          <div style={{ marginTop: "20px", padding: "15px", border: "2px solid #007acc", borderRadius: "8px" }}>
            <h3>Selected User Details</h3>
            <pre style={{ background: "#f5f5f5", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
              {JSON.stringify(selectedUser, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

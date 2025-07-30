import { MongoClient, Db } from "mongodb";

let db: Db | null = null;
let client: MongoClient | null = null;

export const connectDB = async (input: string) => {
    try {
        if (client) {
            console.log("Database already connected");
            return client;
        }

        client = new MongoClient(input);
        await client.connect();
        db = client.db();
        console.log(`Connected to ${db.databaseName}`);
        return client;
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

export const getDB = (): Db => {
    if (!db) {
        throw new Error("Database not connected. Call connectDB first.");
    }
    return db;
}

export const isConnected = (): boolean => {
    return db !== null;
}
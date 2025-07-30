"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConnected = exports.getDB = exports.connectDB = void 0;
const mongodb_1 = require("mongodb");
let db = null;
let client = null;
const connectDB = (input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (client) {
            console.log("Database already connected");
            return client;
        }
        client = new mongodb_1.MongoClient(input);
        yield client.connect();
        db = client.db();
        console.log(`Connected to ${db.databaseName}`);
        return client;
    }
    catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
});
exports.connectDB = connectDB;
const getDB = () => {
    if (!db) {
        throw new Error("Database not connected. Call connectDB first.");
    }
    return db;
};
exports.getDB = getDB;
const isConnected = () => {
    return db !== null;
};
exports.isConnected = isConnected;

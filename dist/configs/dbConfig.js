"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose_1.default.connect(uri, {
            dbName: "SecurePrint"
        });
        console.log(":: MongoDB connected");
    }
    catch (err) {
        console.error(":: MongoDB connection failed", err);
        process.exit(1);
    }
};
exports.connectDB = connectDB;

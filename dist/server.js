"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const routes_1 = __importDefault(require("./routes"));
dotenv_1.default.config();
const requiredEnvVars = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_BUCKET_NAME",
];
for (const key of requiredEnvVars) {
    if (!process.env[key]) {
        console.warn(`⚠️ Missing environment variable: ${key}`);
    }
}
const app = (0, express_1.default)();
// Core middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_fileupload_1.default)());
app.use((0, morgan_1.default)("dev"));
// Health check route
app.get("/", (_req, res) => {
    res.status(200).json({ message: "✅ SecurePrint API is running fine!" });
});
// File-related routes
app.use("/api/files", routes_1.default);
// Global error handler
// app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//   errorHandler(err, res);
// });
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 SecurePrint backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
exports.default = app;

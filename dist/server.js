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
const dbConfig_1 = require("./configs/dbConfig");
const redisClient_1 = require("./configs/redisClient");
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cleanup_1 = require("./cron/cleanup");
const httpsRedirect_1 = require("./middleware/httpsRedirect");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
(0, dbConfig_1.connectDB)();
const allowedOrigins = [
    "http://localhost:3000", // Frontend local
    "https://secureprint-frontend.vercel.app", // Frontend prod
    "https://secureprint-19d4.onrender.com" // Backend URL
];
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
//CORS
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true); // allow Postman, server-to-server
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Allow preflight
app.options("*", (0, cors_1.default)());
// Redirect HTTP → HTTPS in production
app.use(httpsRedirect_1.enforceHTTPS);
// Trust reverse proxy (needed for HTTPS redirects)
app.set("trust proxy", 1);
// Security headers
app.disable("x-powered-by");
// Prevent MIME sniffing
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
});
// Prevent your viewer from being embedded elsewhere (clickjacking)
// app.use((req, res, next) => {
//   res.setHeader("X-Frame-Options", "DENY");
//   next();
// });
// Prevent small-scale XSS attacks
app.use((req, res, next) => {
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
});
// Health check route
app.get("/", (_req, res) => {
    res.status(200).json({ message: "SecurePrint API is running fine!" });
});
// File-related routes
app.use("/api/files", routes_1.default);
// Global error handler
app.use(errorHandler_1.globalErrorHandler);
// Global rate limit
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute globally
    message: "Too many requests, slow down."
});
app.use(globalLimiter);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`:: SecurePrint backend running on port ${PORT}`);
    console.log(`:: Environment: ${process.env.NODE_ENV || "development"}`);
});
(0, redisClient_1.testRedisConnection)();
(0, cleanup_1.scheduleCleanup)();
exports.default = app;

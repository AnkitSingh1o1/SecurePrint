"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = globalErrorHandler;
function globalErrorHandler(err, req, res, next) {
    console.error(":: UNCAUGHT ERROR:", err);
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    return res.status(status).json({
        success: false,
        message,
    });
}

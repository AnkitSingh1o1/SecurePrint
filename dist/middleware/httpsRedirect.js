"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceHTTPS = void 0;
const enforceHTTPS = (req, res, next) => {
    // Only enforce in production behind a proxy (Render, Railway, Nginx, etc.)
    if (process.env.NODE_ENV === "production") {
        if (req.headers["x-forwarded-proto"] !== "https") {
            const httpsUrl = `https://${req.headers.host}${req.url}`;
            return res.redirect(301, httpsUrl);
        }
    }
    next();
};
exports.enforceHTTPS = enforceHTTPS;

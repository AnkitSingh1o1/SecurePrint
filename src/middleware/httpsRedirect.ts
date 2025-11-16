import { Request, Response, NextFunction } from "express";

export const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  // Only enforce in production behind a proxy (Render, Railway, Nginx, etc.)
  if (process.env.NODE_ENV === "production") {
    if (req.headers["x-forwarded-proto"] !== "https") {
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      return res.redirect(301, httpsUrl);
    }
  }
  next();
};

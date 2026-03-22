import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";

const isProd = () => process.env.NODE_ENV === "production";

/** Mongo driver often throws raw OpenSSL paths; avoid sending those to clients. */
function safeClientMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (
    /ssl|tls|openssl|MongoNetworkError|MongoServerSelectionError|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|authentication failed|bad auth/i.test(
      msg
    )
  ) {
    return isProd()
      ? "Database unavailable"
      : "Database connection failed — check MONGO_URI, Atlas IP allowlist (Network Access), password encoding in the URI, VPN/firewall, and that the cluster is running.";
  }
  return msg;
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message)
    });
  }

  const anyErr = err as { code?: number; status?: number; message?: string; name?: string };

  if (anyErr.code === 11000) {
    return res.status(409).json({ message: "Conflict — duplicate resource" });
  }

  if (typeof anyErr.status === "number" && anyErr.status >= 400 && anyErr.status < 500) {
    return res.status(anyErr.status).json({
      message: anyErr.message || "Request failed"
    });
  }

  console.error("[error]", err);

  res.status(500).json({
    message: isProd() ? "Internal server error" : safeClientMessage(err)
  });
};

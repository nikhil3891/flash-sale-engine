import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID();
  res.locals.requestId = id;
  res.setHeader("x-request-id", id);
  next();
};

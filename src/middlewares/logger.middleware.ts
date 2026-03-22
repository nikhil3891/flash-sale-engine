import type { Request, Response, NextFunction } from "express";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const requestId = res.locals.requestId as string | undefined;

    console.log({
      requestId,
      method: req.method,
      url: req.url,
      durationMs: duration,
      status: res.statusCode
    });
  });

  next();
};

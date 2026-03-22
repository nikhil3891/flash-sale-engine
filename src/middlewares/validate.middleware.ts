import { ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

type ParseInput = { body: unknown; params: unknown };

export const validate =
  (schema: ZodType<ParseInput>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: err.issues
        });
      }
      return res.status(400).json({ message: "Validation failed" });
    }
  };

import type { Request, Response, NextFunction } from "express";
import { getDashboard } from "./dashboard.service";

export const getDashboardController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getDashboard();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

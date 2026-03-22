import express from "express";
import { getDashboardController } from "./dashboard.controller";

const router = express.Router();

router.get("/dashboard", getDashboardController);

export default router;
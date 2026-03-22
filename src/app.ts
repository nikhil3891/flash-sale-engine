import express from "express";
import cors from "cors";

import orderRoutes from "./modules/order/order.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

import { errorHandler } from "./middlewares/error.middleware";
import { logger } from "./middlewares/logger.middleware";
import { requestId } from "./middlewares/requestId.middleware";

const app = express();

app.use(cors());
app.use(express.json());

// middlewares
app.use(requestId);
app.use(logger);

// routes
app.use("/order", orderRoutes);
app.use("/admin", dashboardRoutes);

// health check
app.get("/health", (req, res) => {
  res.send("Server is running");
});

// error handler (last)
app.use(errorHandler);

export default app;
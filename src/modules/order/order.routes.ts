import express from "express";
import { createOrder } from "./order.controller";
import { validate } from "../../middlewares/validate.middleware";
import { createOrderSchema } from "./order.validation";

const router = express.Router();

router.post("/:productId", validate(createOrderSchema), createOrder);

export default router;

import { Request, Response, NextFunction } from "express";
import { createOrderService } from "./order.service";

function getIdempotencyKey(req: Request): string | undefined {
  const raw = req.headers["idempotency-key"];
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return raw;
}

function firstString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = firstString(req.params.productId);
    const userId = req.body?.userId as string | undefined;

    const idempotencyKey = getIdempotencyKey(req);

    if (!idempotencyKey) {
      return res.status(400).json({ message: "Idempotency key required" });
    }
    if (!productId || !userId) {
      return res.status(400).json({ message: "productId and userId are required" });
    }

    const order = await createOrderService({
      productId,
      userId,
      idempotencyKey
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

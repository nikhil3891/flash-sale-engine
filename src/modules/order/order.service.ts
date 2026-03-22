import mongoose from "mongoose";
import { Order } from "./order.model";
import { Product } from "../product/product.model";
import { AppError } from "../../utils/AppError";

export const createOrderService = async ({
  productId,
  userId,
  idempotencyKey
}: {
  productId: string;
  userId: string;
  idempotencyKey: string;
}) => {
  const session = await mongoose.startSession();

  try {
    let orderDoc: Awaited<ReturnType<typeof Order.findOne>> = null;

    await session.withTransaction(async () => {
      const existing = await Order.findOne({ idempotencyKey }).session(session);
      if (existing) {
        orderDoc = existing;
        return;
      }

      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gt: 0 } },
        { $inc: { stock: -1 } },
        { returnDocument: "after", session }
      );

      if (!product) {
        throw new AppError(409, "Out of stock");
      }

      const [created] = await Order.create(
        [
          {
            productId,
            userId,
            price: product.price,
            idempotencyKey
          }
        ],
        { session }
      );
      orderDoc = created;
    });

    if (!orderDoc) {
      throw new AppError(500, "Order could not be created");
    }

    return orderDoc;
  } catch (err) {
    if (err instanceof AppError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("Transaction numbers are only allowed") ||
      msg.includes("replica set")
    ) {
      throw new AppError(
        503,
        "MongoDB must run as a replica set (e.g. Atlas or local replica set) for order transactions."
      );
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

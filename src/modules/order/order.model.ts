import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true
    },
    price: Number,
    idempotencyKey: {
      type: String,
      required: true,
      unique: true
    }
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: 1 });
orderSchema.index({ productId: 1, createdAt: 1 });

export const Order = mongoose.model("Order", orderSchema);
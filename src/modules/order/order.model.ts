import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    index: true
  },
  userId: String,
  price: Number,
  idempotencyKey: {
    type: String,
    unique: true
  }
}, { timestamps: true });

orderSchema.index({ createdAt: 1 });

export const Order = mongoose.model("Order", orderSchema);
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  stock: Number,
  category: String,
  saleStartTime: Date
}, { timestamps: true });

productSchema.index({ stock: 1 });

export const Product = mongoose.model("Product", productSchema);
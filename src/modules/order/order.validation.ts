import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    userId: z.string().min(1)
  }),
  params: z.object({
    productId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, "productId must be a valid id")
  })
});


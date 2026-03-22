import request from "supertest";
import app from "../app";
import { Product } from "../modules/product/product.model";
import { Order } from "../modules/order/order.model";

describe("Order engine", () => {
  beforeEach(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({});
  });

  it("should not oversell stock", async () => {
    const product = await Product.create({
      name: "Flash Product",
      price: 100,
      stock: 5,
      category: "test",
      saleStartTime: new Date()
    });

    const requests = Array.from({ length: 50 }).map((_, i) =>
      request(app)
        .post(`/order/${product._id}`)
        .set("idempotency-key", `key-${i}`)
        .send({ userId: `user-${i}` })
    );

    const responses = await Promise.allSettled(requests);

    const success = responses.filter(
      (r): r is PromiseFulfilledResult<request.Response> =>
        r.status === "fulfilled" && r.value.status === 201
    );

    const failed = responses.filter(
      (r): r is PromiseFulfilledResult<request.Response> =>
        r.status === "fulfilled" && r.value.status === 409
    );

    expect(success.length).toBe(5);
    expect(failed.length).toBe(45);
  });

  it("same idempotency key does not create a second order or double decrement", async () => {
    const product = await Product.create({
      name: "Idempotent Product",
      price: 50,
      stock: 3,
      category: "test",
      saleStartTime: new Date()
    });

    const key = "idem-test-key-1";
    const url = `/order/${product._id}`;

    const first = await request(app)
      .post(url)
      .set("idempotency-key", key)
      .send({ userId: "user-a" });

    const second = await request(app)
      .post(url)
      .set("idempotency-key", key)
      .send({ userId: "user-a" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(String(first.body._id)).toBe(String(second.body._id));

    const fresh = await Product.findById(product._id).lean();
    expect(fresh?.stock).toBe(2);
  });
});

import mongoose from "mongoose";
import { getEnv } from "../config/env";

beforeAll(async () => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  const { mongoUri } = getEnv();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  jest.restoreAllMocks();
  await mongoose.connection.close();
});
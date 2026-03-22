import mongoose from "mongoose";
import app from "./app";
import { getEnv } from "./config/env";

const { mongoUri, port } = getEnv();

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
};

startServer();

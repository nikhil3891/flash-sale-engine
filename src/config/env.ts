import dotenv from "dotenv";

dotenv.config({ quiet: process.env.NODE_ENV === "test" });

function resolveMongoUri(): string | undefined {
  return (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    undefined
  );
}

export function getEnv() {
  const mongoUri = resolveMongoUri();
  if (!mongoUri) {
    throw new Error(
      "Set MONGO_URI (or MONGODB_URI / DATABASE_URL) in your .env file."
    );
  }
  const port = process.env.PORT ? Number(process.env.PORT) : 5000;
  return { mongoUri, port };
}

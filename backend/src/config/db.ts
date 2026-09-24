import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] Connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] Disconnected from MongoDB");
  });
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

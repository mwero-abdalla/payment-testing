import mongoose from "mongoose";
import "@/models";

type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCached: CachedConnection | undefined;
}

const cached: CachedConnection = global.__mongooseCached ?? {
  conn: null,
  promise: null,
};

if (!global.__mongooseCached) {
  global.__mongooseCached = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Please define it in your environment.",
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);

    cached.promise = mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME,
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

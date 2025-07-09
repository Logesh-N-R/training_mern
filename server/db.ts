import { MongoClient, Db } from "mongodb";

let client: MongoClient;
let db: Db;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://logeshnr17:FfY1VxMqKHVNwsL2@cluster0.y6gasxf.mongodb.net/ProjectDB?retryWrites=true&w=majority";
const DB_NAME = process.env.DB_NAME || "daily_training_test";

export async function connectToDatabase(): Promise<Db> {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  }
  return db;
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error(
      "Database not initialized. Call connectToDatabase() first.",
    );
  }
  return db;
}

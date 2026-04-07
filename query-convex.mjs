import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function check() {
  const data = await client.query("users:debugDatabases");
  console.log("USERS TABLE:", data.authUsers);
  console.log("APP USERS TABLE:", data.appUsers);
}
check();

// File: app/api/db-ping/route.ts
// This route is called by a Vercel Cron Job every 12 hours to prevent
// the Astra DB from going into hibernation due to inactivity.

import { DataAPIClient } from "@datastax/astra-db-ts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Vercel Cron Jobs send a GET request — this handler performs the ping
export async function GET(req: Request) {
  // Optional: require a secret header so the endpoint can't be abused publicly
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
  } = process.env;

  if (!ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_COLLECTION) {
    return NextResponse.json(
      { error: "Missing required Astra DB environment variables." },
      { status: 500 }
    );
  }

  try {
    const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
    const db = client.db(ASTRA_DB_API_ENDPOINT, {
      namespace: ASTRA_DB_NAMESPACE,
    });

    const collection = await db.collection(ASTRA_DB_COLLECTION);

    // Lightweight read — just fetch one document to keep the DB warm
    await collection.findOne({});

    const timestamp = new Date().toISOString();
    console.log(`✅ Astra DB keep-alive ping successful at ${timestamp}`);

    return NextResponse.json({
      success: true,
      message: "Astra DB keep-alive ping successful.",
      timestamp,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Astra DB keep-alive ping failed:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

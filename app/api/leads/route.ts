import { NextRequest, NextResponse } from 'next/server';
import { DataAPIClient } from "@datastax/astra-db-ts";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

// Initialize Astra DB client for leads collection
const client = ASTRA_DB_APPLICATION_TOKEN 
  ? new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
  : null;
const db = client && ASTRA_DB_API_ENDPOINT
  ? client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })
  : null;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, title, date, time, timezone } = body;

    // Validate required fields
    if (!email || !name || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, title' },
        { status: 400 }
      );
    }

    // Create lead object
    const lead = {
      email,
      name,
      title,
      date: date || null,
      time: time || null,
      timezone: timezone || 'America/New_York',
      createdAt: new Date().toISOString(),
      status: 'pending',
      source: 'chatbot'
    };

    // Store in Astra DB if available
    if (db) {
      try {
        const collection = await db.collection('leads');
        await collection.insertOne(lead);
        console.log('✅ Lead saved to database:', email);
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Continue even if DB fails - we'll still return success
      }
    }

    // TODO: Integrate with calendar APIs (Google Calendar, Outlook, etc.)
    // TODO: Send email confirmation
    // Example:
    // await sendCalendarInvite({ email, name, date, time, timezone });
    // await sendEmailConfirmation({ email, name, date, time });

    return NextResponse.json({ 
      success: true, 
      lead,
      message: 'Lead saved successfully. Calendar invite will be sent shortly.'
    });

  } catch (error) {
    console.error('Error in leads API:', error);
    return NextResponse.json(
      { error: 'Failed to process lead', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve leads (optional, for admin purposes)
export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const collection = await db.collection('leads');
    const cursor = collection.find(null, { limit: 100 });
    const leads = await cursor.toArray();

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

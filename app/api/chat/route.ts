// File: app/api/chat/route.ts

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';

// Get environment variables
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GEMINI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
} = process.env;

// Use GOOGLE_GENERATIVE_AI_API_KEY if available, fallback to GEMINI_API_KEY
const apiKey = GOOGLE_GENERATIVE_AI_API_KEY || GEMINI_API_KEY;

// Validate required environment variables
if (!apiKey || !ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_COLLECTION) {
  throw new Error('Missing required environment variables');
}

// Set GOOGLE_GENERATIVE_AI_API_KEY environment variable for @ai-sdk/google compatibility
// The google() function checks for this env var if apiKey parameter doesn't work
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && apiKey) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
}

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "embedding-001",
  apiKey: apiKey,
});

// Initialize clients and models
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// Note: We'll try multiple models dynamically in the POST handler
// to find one that's available in the user's API account

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    console.log('POST /api/chat - Request received');

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages } = body;
    console.log('Messages received:', messages?.length, 'messages');

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid or empty messages array' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the latest message object
    const latestMessageObj = messages[messages.length - 1];

    // Extract message content from different possible structures
    let latestMessage: string;

    if (latestMessageObj?.parts && Array.isArray(latestMessageObj.parts)) {
      // Handle parts array structure
      const textPart = latestMessageObj.parts.find((part: any) => part.type === 'text' && part.text);
      latestMessage = textPart?.text;
    } else {
      // Handle direct content properties
      latestMessage = latestMessageObj?.content || latestMessageObj?.text || latestMessageObj?.message;
    }

    if (typeof latestMessage !== 'string' || latestMessage.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'No valid message content found'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate embedding for the latest message
    let embedding;
    try {
      embedding = await embeddings.embedQuery(latestMessage);
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
      return new Response(
        JSON.stringify({
          error: 'Failed to generate embedding',
          details: embeddingError instanceof Error ? embeddingError.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Retrieve relevant documents from vector database
    let docContext = "";
    try {
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        console.warn('Invalid embedding, skipping vector search');
      } else {
        const collection = await db.collection(ASTRA_DB_COLLECTION);
        const cursor = collection.find(null, {
          sort: { $vector: embedding },
          limit: 10,
        });
        const documents = await cursor.toArray();

        // Join the documents as text
        docContext = documents?.map(doc => doc.text || doc.content || '').filter(text => text.length > 0).join("\n") || "";

        console.log(`Retrieved ${documents?.length || 0} relevant documents`);
      }
    } catch (dbError) {
      console.error("Error querying Astra DB:", dbError);
      // Continue without context rather than failing completely
      docContext = "";
    }

    // System prompt
    const systemPrompt = `You are an AI assistant who is an expert on RapidClaims and the Revenue Cycle Management (RCM) industry.
Use the below context to augment what you know about RapidClaims. The context will provide you with the most recent page data from the official RapidClaims website, internal documents, case studies, and press releases.
If the context doesn't include the information you need, answer based on your existing knowledge and don't mention the source of your information or what the context does or doesn't include.
Format responses using markdown where applicable and don't return images.
--------------
START CONTEXT
${docContext}
END CONTEXT
--------------`;

    // Call streamText with proper message format
    console.log('Calling streamText...');

    // Convert messages to model format using convertToModelMessages (recommended for useChat)
    let formattedMessages;
    try {
      formattedMessages = convertToModelMessages(messages);
      console.log('✅ Converted messages using convertToModelMessages:', formattedMessages.length);
    } catch (convertError) {
      console.warn('⚠️ convertToModelMessages failed, using manual conversion:', convertError);
      // Fallback to manual conversion
      formattedMessages = messages.map((msg: any) => {
        let content = '';

        // Extract content from different message structures
        if (msg.parts && Array.isArray(msg.parts)) {
          // Handle parts array structure
          const textPart = msg.parts.find((part: any) => part.type === 'text' && part.text);
          content = textPart?.text || '';
        } else {
          // Handle direct content properties
          content = msg.content || msg.text || msg.message || '';
        }

        return {
          role: msg.role || 'user',
          content: content
        };
      });
      console.log('✅ Formatted messages manually:', formattedMessages.length);
    }

    // Try multiple models in sequence until one works
    // Based on available models from your account, trying these in order:
    const modelNamesToTry = [
      'gemini-2.5-flash',        // Latest stable Flash model
      'gemini-2.0-flash',        // Stable Flash model
      'gemini-flash-latest',     // Latest Flash (auto-updates)
      'gemini-2.5-pro',          // Latest Pro model
      'gemini-pro-latest',       // Latest Pro (auto-updates)
      'gemini-2.0-flash-exp',    // Experimental Flash
    ];
    let result: any = null;
    let lastError: any = null;

    for (const modelName of modelNamesToTry) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        const currentModel = google(modelName, { apiKey: apiKey });
        result = await streamText({
          model: currentModel,
          system: systemPrompt,
          messages: formattedMessages,
        });
        console.log(`✅ Successfully using model: ${modelName}`);
        break; // Success, exit loop
      } catch (modelError: any) {
        console.error(`❌ Model ${modelName} failed:`, modelError.message);
        lastError = modelError;
        // Continue to next model
        continue;
      }
    }

    // If all models failed, throw descriptive error
    if (!result) {
      throw new Error(
        `No available Gemini models found. Tried: ${modelNamesToTry.join(', ')}. ` +
        `Run 'npm run list-models' to see all available models in your account. ` +
        `Last error: ${lastError?.message || 'Unknown error'}`
      );
    }

    console.log('streamText completed, returning response...');

    // Return the streaming response for useChat hook from @ai-sdk/react
    // The useChat hook expects a data stream response
    // Try toUIMessageStreamResponse first (it was working in logs)
    try {
      if (typeof (result as any).toUIMessageStreamResponse === 'function') {
        console.log('Using toUIMessageStreamResponse()');
        return (result as any).toUIMessageStreamResponse();
      }

      // Fallback: try toDataStreamResponse
      if (typeof (result as any).toDataStreamResponse === 'function') {
        console.log('Using toDataStreamResponse()');
        return (result as any).toDataStreamResponse();
      }

      // If neither exists, the result object might be different than expected
      console.error('No response method found. Result keys:', Object.keys(result));
      throw new Error('StreamText result does not have toUIMessageStreamResponse or toDataStreamResponse method');

    } catch (responseError: any) {
      console.error('Error creating response:', responseError);
      throw new Error(`Failed to create streaming response: ${responseError.message}`);
    }

  } catch (err) {
    console.error("POST error:", err);
    return new Response(
      JSON.stringify({
        error: 'An error occurred',
        details: err instanceof Error ? err.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
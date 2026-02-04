// File: app/api/chat/route.ts

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages } from 'ai';

// Type definitions for message structures
interface MessagePart {
  type: string;
  text?: string;
}

interface Message {
  role?: string;
  content?: string;
  text?: string;
  message?: string;
  parts?: MessagePart[];
}

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

// Validate required environment variables at startup
if (!apiKey || !ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_COLLECTION) {
  const missingVars = [];
  if (!apiKey) missingVars.push('GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
  if (!ASTRA_DB_APPLICATION_TOKEN) missingVars.push('ASTRA_DB_APPLICATION_TOKEN');
  if (!ASTRA_DB_API_ENDPOINT) missingVars.push('ASTRA_DB_API_ENDPOINT');
  if (!ASTRA_DB_COLLECTION) missingVars.push('ASTRA_DB_COLLECTION');

  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
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

// Database heartbeat - pings every 12 hours to keep connection alive
setInterval(async () => {
  try {
    await db.admin().ping();
    console.log("Database heartbeat sent successfully at", new Date().toISOString());
  } catch (error) {
    console.error("Database heartbeat failed:", error);
  }
}, 12 * 60 * 60 * 1000);

console.log("Database heartbeat started - will ping every 12 hours");

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
      // Handle parts array structure (useChat v2.0.15 format)
      const textPart = latestMessageObj.parts.find((part: MessagePart) => part.type === 'text' && part.text);
      latestMessage = textPart?.text || '';
    } else {
      // Handle direct content properties
      latestMessage = latestMessageObj?.content || latestMessageObj?.text || latestMessageObj?.message || '';
    }

    // Validate message content
    if (typeof latestMessage !== 'string' || latestMessage.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'No valid message content found',
          details: 'The message must contain text content'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Note: Booking intent detection is handled on the client side for better UX
    // The client will show booking UI directly when booking keywords are detected

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

        // Filter and process documents
        if (documents && Array.isArray(documents)) {
          // Filter documents by similarity score if available
          // Note: Astra DB may return similarity scores in different formats
          const MIN_SIMILARITY_THRESHOLD = 0.5; // Adjust based on your needs (0-1 scale)

          interface DocumentWithSimilarity {
            text?: string;
            content?: string;
            $similarity?: number;
            similarity?: number;
            [key: string]: unknown;
          }

          const relevantDocs = documents.filter((doc: DocumentWithSimilarity) => {
            // Check for similarity score in various possible formats
            if (doc.$similarity !== undefined && doc.$similarity < MIN_SIMILARITY_THRESHOLD) {
              return false;
            }
            if (doc.similarity !== undefined && doc.similarity < MIN_SIMILARITY_THRESHOLD) {
              return false;
            }
            // If no similarity score, include the document (Astra DB may not always provide it)
            return true;
          });

          console.log(`Filtered to ${relevantDocs.length} relevant documents (from ${documents.length} total)`);

          // Join the documents as text with proper filtering
          docContext = relevantDocs
            .map((doc: { text?: string; content?: string;[key: string]: unknown }) => {
              // Handle different document structures
              if (typeof doc === 'object' && doc !== null) {
                return doc.text || doc.content || '';
              }
              return '';
            })
            .filter((text: string) => text && text.trim().length > 0)
            .join("\n\n")
            .trim();
        }

        console.log(`Retrieved ${documents?.length || 0} relevant documents`);
        console.log(`Context length: ${docContext.length} characters`);
        if (docContext.length < 50) {
          console.warn('⚠️ Very short context retrieved - may not have relevant information');
        }
      }
    } catch (dbError) {
      console.error("Error querying Astra DB:", dbError);
      // Continue without context rather than failing completely
      // This ensures the chatbot still works even if the database is temporarily unavailable
      docContext = "";
    }

    // Check for empty context
    if (!docContext || docContext.trim().length === 0) {
      console.warn('⚠️ No context retrieved from database - responses will be limited');
    }

    // System prompt - STRICT RAG: Only use provided context
    const systemPrompt = `You are an AI assistant for RapidClaims, a Revenue Cycle Management (RCM) company.
    
CRITICAL INSTRUCTIONS:
- You MUST ONLY answer questions using the information provided in the context below
- If the context does NOT contain the information needed to answer the question, you MUST say: "I don't have that information in my knowledge base. Could you please rephrase your question or ask about something else related to RapidClaims?"
- DO NOT use any knowledge outside of the provided context
- DO NOT make up or infer information that isn't explicitly stated in the context
- If asked about topics unrelated to RapidClaims or RCM, politely redirect: "I'm specialized in answering questions about RapidClaims and Revenue Cycle Management. How can I help you with that?"

RESPONSE STYLE GUIDELINES:
- Provide comprehensive, detailed responses by default - don't wait for users to ask for "details" or "explain in detail"
- Include relevant information from the context such as features, benefits, capabilities, results, and use cases
- Structure responses with clear sections, bullet points, or numbered lists when appropriate
- Use bold formatting for important metrics, percentages, and key terms
- Provide context and background information to help users understand the full picture
- Include specific examples, statistics, and results mentioned in the context when relevant
- Aim for thorough explanations that anticipate follow-up questions

The context below contains information from the official RapidClaims website, internal documents, case studies, and press releases:
--------------
START CONTEXT
${docContext || 'No context available.'}
END CONTEXT
--------------

Format your responses using markdown where applicable. Do not return images.`;

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
      formattedMessages = messages.map((msg: Message) => {
        let content = '';

        // Extract content from different message structures
        if (msg.parts && Array.isArray(msg.parts)) {
          // Handle parts array structure
          const textPart = msg.parts.find((part: MessagePart) => part.type === 'text' && part.text);
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
    let result: Awaited<ReturnType<typeof streamText>> | null = null;
    let lastError: Error | null = null;

    for (const modelName of modelNamesToTry) {
      try {
        console.log(`Attempting to use model: ${modelName}`);
        // google() function reads API key from GOOGLE_GENERATIVE_AI_API_KEY env var
        const currentModel = google(modelName);
        result = await streamText({
          model: currentModel,
          system: systemPrompt,
          messages: formattedMessages,
        });
        console.log(`✅ Successfully using model: ${modelName}`);
        break; // Success, exit loop
      } catch (modelError) {
        const error = modelError instanceof Error ? modelError : new Error(String(modelError));
        console.error(`❌ Model ${modelName} failed:`, error.message);
        lastError = error;
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

    // Return the streaming response for useChat hook from @ai-sdk/react v2.0.15
    // useChat expects toUIMessageStreamResponse for proper message handling
    try {
      // Use toUIMessageStreamResponse - this is the correct method for useChat hook
      // Type assertion needed because TypeScript doesn't recognize this method on the generic type
      const resultWithMethods = result as {
        toUIMessageStreamResponse?: () => Response;
        toTextStreamResponse?: () => Response;
      };

      if (resultWithMethods && typeof resultWithMethods.toUIMessageStreamResponse === 'function') {
        console.log('Using toUIMessageStreamResponse() - correct method for useChat');
        return resultWithMethods.toUIMessageStreamResponse();
      }

      // Fallback to toTextStreamResponse (should work but less ideal)
      if (result && typeof result.toTextStreamResponse === 'function') {
        console.log('Using toTextStreamResponse() - fallback');
        return result.toTextStreamResponse();
      }

      // If neither exists, the result object might be different than expected
      console.error('No response method found. Available methods:', result ? Object.getOwnPropertyNames(Object.getPrototypeOf(result)) : 'null');
      throw new Error('StreamText result does not have toUIMessageStreamResponse or toTextStreamResponse method');

    } catch (responseError) {
      const error = responseError instanceof Error ? responseError : new Error(String(responseError));
      console.error('Error creating response:', error);
      throw new Error(`Failed to create streaming response: ${error.message}`);
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
// File: app/api/chat/route.ts

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

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

// Debug environment variables (remove after testing)
console.log('ENV DEBUG:', {
  hasNamespace: !!ASTRA_DB_NAMESPACE,
  hasCollection: !!ASTRA_DB_COLLECTION,
  hasEndpoint: !!ASTRA_DB_API_ENDPOINT,
  hasToken: !!ASTRA_DB_APPLICATION_TOKEN,
  hasGeminiKey: !!GEMINI_API_KEY,
  hasGoogleGenAIKey: !!GOOGLE_GENERATIVE_AI_API_KEY,
  apiKeyLength: apiKey?.length || 0
});

// Validate required environment variables
if (!apiKey || !ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT || !ASTRA_DB_COLLECTION) {
  throw new Error('Missing required environment variables');
}

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "embedding-001",
  apiKey: apiKey,
});

// Initialize clients and models
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const model = google('gemini-1.5-flash', {
  apiKey: apiKey,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  // Debug environment variables
  console.log('DEBUG: API key exists:', !!apiKey);
  console.log('DEBUG: API key length:', apiKey?.length || 0);
  
  try {
    console.log('DEBUG: Starting POST request processing');
    const { messages } = await req.json();
    console.log('DEBUG: Messages parsed successfully, count:', messages?.length || 0);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('DEBUG: Invalid messages array');
      return new Response('Invalid or empty messages array', { status: 400 });
    }

    // Get the latest message object and log its structure
    const latestMessageObj = messages[messages.length - 1];
    console.log('DEBUG: Latest message object:', JSON.stringify(latestMessageObj, null, 2));
    
    // Extract message content from different possible structures
    let latestMessage;
    
    if (latestMessageObj?.parts && Array.isArray(latestMessageObj.parts)) {
      // Handle parts array structure (like your current format)
      const textPart = latestMessageObj.parts.find(part => part.type === 'text' && part.text);
      latestMessage = textPart?.text;
    } else {
      // Handle direct content properties
      latestMessage = latestMessageObj?.content || latestMessageObj?.text || latestMessageObj?.message;
    }
    
    console.log('DEBUG: Latest message content:', latestMessage);

    if (typeof latestMessage !== 'string' || latestMessage.trim() === '') {
      console.log('DEBUG: Invalid message content');
      console.log('DEBUG: Available properties:', Object.keys(latestMessageObj || {}));
      return new Response(
        JSON.stringify({ 
          error: 'No valid message content found', 
          availableProperties: Object.keys(latestMessageObj || {}),
          messageObj: latestMessageObj 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('DEBUG: About to generate embedding...');
    let embedding;
    try {
      embedding = await embeddings.embedQuery(latestMessage);
      console.log('DEBUG: Embedding generated successfully, length:', embedding?.length || 0);
    } catch (embeddingError) {
      console.error('DEBUG: Embedding generation failed:', embeddingError);
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

    let docContext = "";
    try {
      console.log('DEBUG: Querying Astra DB...');
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: { $vector: embedding }, 
        limit: 10,
      }); 
      const documents = await cursor.toArray();
      console.log('DEBUG: Retrieved documents count:', documents?.length || 0);
      
      // Join the documents as text, don't stringify as JSON
      docContext = documents?.map(doc => doc.text || doc.content || '').filter(text => text.length > 0).join("\n") || "";
      console.log('DEBUG: Document context length:', docContext.length);
      
    } catch (dbError) {
      console.error("Error querying Astra DB: ", dbError);
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

    console.log('DEBUG: About to call streamText...');
    
    // Call streamText with proper message format
    const result = await streamText({
      model: model,
      system: systemPrompt,
      messages: messages.map(msg => {
        let content = '';
        
        // Extract content from different message structures
        if (msg.parts && Array.isArray(msg.parts)) {
          // Handle parts array structure
          const textPart = msg.parts.find(part => part.type === 'text' && part.text);
          content = textPart?.text || '';
        } else {
          // Handle direct content properties
          content = msg.content || msg.text || msg.message || '';
        }
        
        return {
          role: msg.role || 'user',
          content: content
        };
      }),
    });

    console.log('DEBUG: StreamText called successfully');

    // Return the streaming response - try different methods based on AI SDK version
    if (typeof result.toDataStreamResponse === 'function') {
      console.log('DEBUG: Using toDataStreamResponse');
      return result.toDataStreamResponse();
    } else if (typeof result.toAIStreamResponse === 'function') {
      console.log('DEBUG: Using toAIStreamResponse');
      return result.toAIStreamResponse();
    } else if (typeof result.toTextStreamResponse === 'function') {
      console.log('DEBUG: Using toTextStreamResponse');
      return result.toTextStreamResponse();
    } else {
      // Fallback: return the result directly
      console.log('DEBUG: Available methods on result:', Object.getOwnPropertyNames(result));
      console.log('DEBUG: Returning result directly');
      return result;
    }

  } catch (err) {
    console.error("POST error:", err);
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred', 
        details: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
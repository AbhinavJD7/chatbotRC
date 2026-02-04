# 🔌 API Modification for PBMP Support

## Overview

This guide shows how to modify your existing RapidClaims API to support both RapidClaims and PBMP collections.

---

## 🎯 Approach

Instead of creating a new API, we'll modify the existing `/api/chat` route to accept a collection parameter.

---

## 📝 Step 1: Update Environment Variables

Add to your `.env` file in the main `chatbotRC` directory:

```bash
# Existing variables (keep these)
ASTRA_DB_NAMESPACE=default_keyspace
ASTRA_DB_COLLECTION=rapidclaims_docs
ASTRA_DB_API_ENDPOINT=https://xxx.apps.astra.datastax.com
ASTRA_DB_APPLICATION_TOKEN=AstraCS:xxx
GEMINI_API_KEY=xxx
GOOGLE_GENERATIVE_AI_API_KEY=xxx

# NEW: Add this for PBMP
PBMP_ASTRA_DB_COLLECTION=pbmp_docs
```

---

## 🔧 Step 2: Modify API Route

Update `app/api/chat/route.ts` to support collection parameter:

### Find this section (around line 23-30):
```typescript
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  GEMINI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY,
} = process.env;
```

### Add after it:
```typescript
// Support for multiple collections (PBMP, RapidClaims, etc.)
const PBMP_COLLECTION = process.env.PBMP_ASTRA_DB_COLLECTION || 'pbmp_docs';
```

### Then find this section (around line 147-160):
```typescript
// Retrieve relevant documents from vector database
let docContext = "";
try {
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    console.warn('Invalid embedding, skipping vector search');
  } else {
    const collection = await db.collection(ASTRA_DB_COLLECTION);
```

### Replace with:
```typescript
// Retrieve relevant documents from vector database
let docContext = "";
try {
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    console.warn('Invalid embedding, skipping vector search');
  } else {
    // Get collection from URL param or use default (RapidClaims)
    const url = new URL(req.url);
    const collectionParam = url.searchParams.get('collection');
    const collectionName = collectionParam === 'pbmp' ? PBMP_COLLECTION : ASTRA_DB_COLLECTION;
    
    console.log(`Using collection: ${collectionName}`);
    const collection = await db.collection(collectionName);
```

### Update the system prompt (around line 220-230):

Find:
```typescript
const systemPrompt = `You are an AI assistant for RapidClaims, a Revenue Cycle Management (RCM) company.
```

Replace with:
```typescript
// Determine which assistant based on collection
const url = new URL(req.url);
const collectionParam = url.searchParams.get('collection');
const isPBMP = collectionParam === 'pbmp';

const systemPrompt = isPBMP 
  ? `You are an AI assistant for PBMP (Personal & Business Management Platform).
    
CRITICAL INSTRUCTIONS:
- You MUST ONLY answer questions using the information provided in the context below
- If the context does NOT contain the information needed to answer the question, you MUST say: "I don't have that information in my knowledge base. Could you please rephrase your question or ask about something else related to PBMP?"
- DO NOT use any knowledge outside of the provided context
- DO NOT make up or infer information that isn't explicitly stated in the context
- If asked about topics unrelated to PBMP or personal/business management, politely redirect

RESPONSE STYLE GUIDELINES:
- Provide comprehensive, detailed responses by default
- Include relevant information about personal and business management features
- Structure responses with clear sections, bullet points, or numbered lists when appropriate
- Use bold formatting for important features and capabilities
- Provide context and background to help users understand the full picture

The context below contains information from PBMP documentation:
--------------
START CONTEXT
\${docContext || 'No context available.'}
END CONTEXT
--------------

Format your responses using markdown where applicable. Do not return images.`
  : `You are an AI assistant for RapidClaims, a Revenue Cycle Management (RCM) company.
    
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
\${docContext || 'No context available.'}
END CONTEXT
--------------

Format your responses using markdown where applicable. Do not return images.`;
```

---

## 🔄 Step 3: Update PBMP Frontend

Update `hbmpchat/.env`:

```bash
# Point to RapidClaims API with PBMP collection parameter
VITE_API_ENDPOINT=http://localhost:3000/api/chat?collection=pbmp
```

---

## 🧪 Step 4: Test the Setup

### Terminal 1 - Start RapidClaims API:
```bash
cd chatbotRC
npm run dev
```

### Terminal 2 - Start PBMP:
```bash
cd hbmpchat
npm run dev
```

### Test:
1. Visit `http://localhost:3001` (PBMP)
2. Ask a question from your PBMP docs
3. Check the API logs - should show: `Using collection: pbmp_docs`
4. Response should come from PBMP knowledge base

---

## 📊 How It Works

```
Request Flow:
PBMP (localhost:3001)
    ↓
GET /api/chat?collection=pbmp
    ↓
API checks 'collection' param
    ↓
If 'pbmp' → use pbmp_docs collection
If not → use rapidclaims_docs collection (default)
    ↓
Query appropriate collection in AstraDB
    ↓
Return context-aware response
```

---

## ✅ Verification

After modification, test both chatbots:

**RapidClaims** (localhost:3000):
- Should use `rapidclaims_docs` collection
- Answers RapidClaims questions

**PBMP** (localhost:3001):
- Should use `pbmp_docs` collection
- Answers PBMP questions

---

## 🐛 Troubleshooting

### API says "Using collection: undefined"
- Check `.env` has `PBMP_ASTRA_DB_COLLECTION=pbmp_docs`
- Restart Next.js server

### PBMP getting RapidClaims answers
- Check `hbmpchat/.env` has `?collection=pbmp` in URL
- Clear browser cache
- Check API logs for collection name

### No context retrieved
- Run `npm run seed:pbmp` to load PBMP docs
- Check AstraDB dashboard for pbmp_docs collection
- Verify collection has documents

---

## 🚀 Next Steps

1. ✅ Modify API route (above)
2. ✅ Update PBMP .env with collection param
3. ✅ Load PBMP docs: `npm run seed:pbmp`
4. ✅ Test both chatbots
5. ✅ Deploy!

---

Need help with the modifications? I can make the changes for you!

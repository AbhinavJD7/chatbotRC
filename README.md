# RapidClaims Chatbot

A Next.js chatbot application for RapidClaims that uses RAG (Retrieval-Augmented Generation) with Google Gemini AI and DataStax Astra DB for vector storage.

## Features

- 🤖 AI-powered chatbot using Google Gemini
- 🔍 Vector similarity search with Astra DB
- 📚 RAG (Retrieval-Augmented Generation) architecture
- 💬 Streaming responses
- 🎨 Modern chat interface

## Prerequisites

- Node.js 18+ and npm
- A Google AI Studio account (for Gemini API key)
- A DataStax Astra DB account (free tier available)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (you'll add it to `.env` in step 4)

### 3. Set Up Astra DB

#### Create a New Database

1. Go to [DataStax Astra DB](https://astra.datastax.com/)
2. Sign in or create a free account
3. Click "Create Database" or "Add Database"
4. Choose:
   - **Database Name**: e.g., `chatbot-db`
   - **Provider & Region**: Choose the closest region to you
   - **Database Type**: Select "Vector Database" (or "Serverless")
5. Click "Create Database"
6. Wait 2-3 minutes for the database to be created

#### Get Your Database Credentials

Once your database is ready:

1. Click on your database name
2. Go to the **"Connect"** tab
3. Under **"Application Tokens"**, click **"Generate Token"**
4. Choose:
   - **Token Name**: e.g., `chatbot-token`
   - **Role**: Select "Database Administrator" (or "Database User" with appropriate permissions)
5. Click "Generate Token"
6. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - It will look like: `AstraCS:xxxxxxxxxxxxx...`

7. Find your **API Endpoint**:
   - In the "Connect" tab, look for "API Endpoint"
   - It will look like: `https://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-xxxxx.apps.astra.datastax.com`
   - Copy this entire URL

8. Find your **Namespace**:
   - In the Astra DB dashboard, go to "CQL Console" or "Data" tab
   - The default namespace is usually `default_keyspace` or you can create a new one
   - For simplicity, you can use `default_keyspace`

### 4. Create Your `.env` File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:

   ```env
   # Astra DB Configuration
   ASTRA_DB_NAMESPACE=default_keyspace
   ASTRA_DB_COLLECTION=rapidclaims_docs
   ASTRA_DB_API_ENDPOINT=https://your-database-id-your-region.apps.astra.datastax.com
   ASTRA_DB_APPLICATION_TOKEN=AstraCS:your_token_here

   # Google Gemini API Key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   **Important Notes:**
   - Replace `your-database-id-your-region.apps.astra.datastax.com` with your actual API Endpoint
   - Replace `AstraCS:your_token_here` with your actual Application Token
   - Replace `your_gemini_api_key_here` with your Gemini API key
   - The `ASTRA_DB_COLLECTION` name can be anything (e.g., `rapidclaims_docs`)

### 5. Seed the Database

This will scrape the RapidClaims website and populate your vector database:

```bash
npm run seed
```

This script will:
- Create a collection in Astra DB (if it doesn't exist)
- Scrape `https://www.rapidclaims.ai/`
- Split the content into chunks
- Generate embeddings using Gemini
- Store everything in your Astra DB collection

**Note:** The first run may take a few minutes depending on the website size.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
chatbotRC/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # API route for chat (RAG implementation)
│   ├── components/
│   │   ├── Bubble.tsx            # Message bubble component
│   │   ├── LoadingBubbles.tsx    # Loading indicator
│   │   ├── PromptSuggestionsButton.tsx
│   │   └── PromptSuggestionsRow.tsx
│   ├── page.tsx                  # Main chat interface
│   └── layout.tsx
├── scripts/
│   └── loadDB.ts                 # Database seeding script
└── .env                          # Environment variables (create this)
```

## Environment Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `ASTRA_DB_NAMESPACE` | Database namespace/keyspace | Astra DB dashboard (usually `default_keyspace`) |
| `ASTRA_DB_COLLECTION` | Collection name for documents | You choose (e.g., `rapidclaims_docs`) |
| `ASTRA_DB_API_ENDPOINT` | Database API endpoint URL | Astra DB "Connect" tab |
| `ASTRA_DB_APPLICATION_TOKEN` | Authentication token | Astra DB "Application Tokens" |
| `GEMINI_API_KEY` | Google Gemini API key | [Google AI Studio](https://aistudio.google.com/app/apikey) |

## Troubleshooting

### Database Connection Issues

- Verify your `ASTRA_DB_API_ENDPOINT` is correct (should start with `https://`)
- Check that your `ASTRA_DB_APPLICATION_TOKEN` is complete (starts with `AstraCS:`)
- Ensure your database is active (not paused/deleted)

### API Key Issues

- Verify your `GEMINI_API_KEY` is correct
- Check if you have API quota remaining in Google AI Studio
- Make sure the API key has not expired

### Vector Dimension Mismatch Error

**Error:** `$vector value can't be empty` or `SHRED_BAD_VECTOR_SIZE`

**Cause:** Your collection was created with a different vector dimension (e.g., 1024) than what Gemini's `embedding-001` produces (768).

**Solution:**
1. Go to [Astra DB Dashboard](https://astra.datastax.com/)
2. Navigate to your database
3. Go to the **"Data Explorer"** tab
4. In the left sidebar, find your collection (e.g., `chatrc_collection`)
5. Click on the collection name
6. Click the **"Delete"** or **"Trash"** icon to delete the collection
7. Run `npm run seed` again - it will create a new collection with the correct 768 dimensions

**Note:** The script will automatically create a collection with 768 dimensions (matching Gemini's embedding-001 model) if it doesn't exist.

### Collection Already Exists Error

If you see "collection already exists", the script will skip creation and continue. If you want to start fresh or fix dimension issues, delete the collection as described above.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Scrape website and populate database
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Google Gemini (`gemini-1.5-flash`)
- **Vector DB**: DataStax Astra DB
- **Embeddings**: Google Generative AI (`embedding-001`)
- **Web Scraping**: Puppeteer
- **Language**: TypeScript

## License

Private project for RapidClaims.

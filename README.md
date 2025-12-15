# RapidClaims Chatbot

A Next.js chatbot application for RapidClaims that uses RAG (Retrieval-Augmented Generation) with Google Gemini AI and DataStax Astra DB for vector storage.

## Features

- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%234169E1'%3E%3Cpath d='M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z'/%3E%3C/svg%3E" width="16" height="16" alt="AI"> AI-powered chatbot using Google Gemini
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%2310B981'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E" width="16" height="16" alt="Vector Search"> Vector similarity search with Astra DB
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%238B5CF6'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E" width="16" height="16" alt="RAG"> RAG (Retrieval-Augmented Generation) architecture
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%23F59E0B'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E" width="16" height="16" alt="Streaming"> Streaming responses with real-time updates
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%23EF4444'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/%3E%3C/svg%3E" width="16" height="16" alt="UI"> Modern, responsive chat interface
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%233B82F6'%3E%3Cpath d='M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z'/%3E%3C/svg%3E" width="16" height="16" alt="Mobile"> Fully optimized for mobile devices
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%23EAB308'%3E%3Cpath d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E" width="16" height="16" alt="New Chat"> New Chat button to reset conversations
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%2310B981'%3E%3Cpath d='M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z'/%3E%3C/svg%3E" width="16" height="16" alt="Prompts"> Prompt suggestions for quick interactions
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%238B5CF6'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.72-2.81-.01-1.79-1.48-2.69-3.65-3.21z'/%3E%3C/svg%3E" width="16" height="16" alt="Centered"> Perfectly centered UI with enhanced positioning
- <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%233B82F6'%3E%3Cpath d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z'/%3E%3C/svg%3E" width="16" height="16" alt="Clean"> Clean message bubbles without avatar prefixes

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
│   ├── assets/
│   │   ├── RClogo.png            # RapidClaims logo
│   │   └── chatbot_back2.jpg     # Background image (if used)
│   ├── components/
│   │   ├── Bubble.tsx            # Message bubble component with markdown support
│   │   ├── LoadingBubbles.tsx    # Loading indicator for AI responses
│   │   ├── PromptSuggestionsButton.tsx  # Individual prompt button
│   │   └── PromptSuggestionsRow.tsx     # Row of prompt suggestion buttons
│   ├── global.css                 # Global styles and responsive design
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                   # Main chat interface component
├── scripts/
│   ├── loadDB.ts                 # Database seeding script (scrapes website)
│   └── listModels.ts             # Script to list available Gemini models
├── .env                          # Environment variables (create this)
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
└── tsconfig.json                 # TypeScript configuration
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

### Build Errors

**Error:** `routes-manifest.json` not found or build cache issues

**Solution:**
```bash
rm -rf .next
npm run build
```

This clears the build cache and regenerates all build files.

### Development Server Issues

If you encounter errors when running `npm run dev`:

1. Stop the server (Ctrl+C)
2. Clean the build cache: `rm -rf .next`
3. Restart: `npm run dev`

### Model Availability

If you see errors about unavailable models, run:
```bash
npm run list-models
```

This will show all available Gemini models in your account. The application automatically tries multiple models in sequence until one works.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Scrape website and populate database
- `npm run seed:test` - Seed database with test mode (only 3 chunks)
- `npm run list-models` - List available Gemini models in your account
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 15.4.10 (App Router)
- **AI SDK**: Vercel AI SDK v5.0.15
- **AI Models**: Google Gemini (auto-fallback: `gemini-2.5-flash`, `gemini-2.0-flash`, etc.)
- **Vector DB**: DataStax Astra DB
- **Embeddings**: Google Generative AI (`embedding-001` - 768 dimensions)
- **Web Scraping**: Puppeteer
- **UI Libraries**: React 18, React Markdown
- **Language**: TypeScript

## UI/UX Features

### Responsive Design
- **Desktop**: Centered card layout with optimal spacing
- **Mobile**: Full-screen optimized experience with touch-friendly buttons
- **Tablet**: Adaptive layout that works on all screen sizes

### Chat Features
- **Streaming Responses**: Real-time message streaming for better UX
- **New Chat Button**: Easily reset conversations and return to main menu
- **Prompt Suggestions**: Quick-start prompts for common questions
- **Loading States**: Visual feedback during AI processing
- **Error Handling**: User-friendly error messages with retry options

### Visual Design
- **Modern Gradient Background**: RapidClaims-inspired purple-blue gradient
- **Clean Message Bubbles**: User messages (red) and assistant messages (white) with proper alignment
- **Smooth Animations**: Slide-in animations for messages
- **Markdown Support**: Rich text formatting in assistant responses

## Deployment

### Vercel Deployment

This project is ready for deployment on Vercel:

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Connect to Vercel**: Import your repository in Vercel
3. **Add Environment Variables**: Set all required environment variables in Vercel project settings:
   - `ASTRA_DB_NAMESPACE`
   - `ASTRA_DB_COLLECTION`
   - `ASTRA_DB_API_ENDPOINT`
   - `ASTRA_DB_APPLICATION_TOKEN`
   - `GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`
4. **Deploy**: Vercel will automatically build and deploy your application

### Build Status
✅ Production build tested and verified
✅ All TypeScript errors resolved
✅ Mobile-responsive design implemented
✅ Optimized for performance

## Recent Updates

- ✨ Added "New Chat" button for easy conversation reset
- 🎨 Enhanced UI positioning and centering
- 📱 Improved mobile responsiveness and touch targets
- 🧹 Removed avatar prefixes ("U" and "RC") for cleaner messages
- 🔧 Fixed production build issues
- 🎯 Better message spacing and alignment
- 📐 Perfect vertical and horizontal centering

## License

Private project for RapidClaims.

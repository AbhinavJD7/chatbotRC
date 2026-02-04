import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    GEMINI_API_KEY,
    PBMP_ASTRA_DB_COLLECTION // New collection for PBMP
} = process.env

// Use PBMP collection or fallback to 'pbmp_docs'
const PBMP_COLLECTION = PBMP_ASTRA_DB_COLLECTION || 'pbmp_docs'

// Validate required environment variables
if (!ASTRA_DB_NAMESPACE || !ASTRA_DB_API_ENDPOINT ||
    !ASTRA_DB_APPLICATION_TOKEN || !GEMINI_API_KEY) {
    throw new Error('Missing required environment variables. Please check your .env file.')
}

// Initialize the Gemini Embedding model
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    model: "embedding-001",
})

// ===================================
// 📝 ADD YOUR PBMP DOCUMENTATION URLs HERE
// ===================================
const pbmpUrls = [
    // Example URLs - Replace with your actual PBMP documentation
    'https://your-pbmp-site.com/docs',
    'https://your-pbmp-site.com/features',
    'https://your-pbmp-site.com/guide',
    // Add more URLs...
]

// Test mode: set to true to only process first 3 chunks (saves API quota)
const TEST_MODE = process.env.TEST_MODE === 'true' || process.argv.includes('--test')
const TEST_CHUNK_LIMIT = 3

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100,
})

// Create the collection if it doesn't exist
const createCollection = async (similarityMetric: SimilarityMetric = "cosine") => {
    try {
        await db.createCollection(PBMP_COLLECTION, {
            vector: {
                dimension: 768, // Gemini embedding-001 produces 768-dimensional vectors
                metric: similarityMetric,
            }
        })
        console.log(`✅ Collection '${PBMP_COLLECTION}' created successfully`)
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            console.log(`ℹ️  Collection '${PBMP_COLLECTION}' already exists`)
        } else {
            console.error('Error creating collection:', error)
            throw error
        }
    }
}

const loadSampleData = async () => {
    console.log('🚀 Starting PBMP Knowledge Base Loading...')
    console.log(`📚 Collection: ${PBMP_COLLECTION}`)
    console.log(`🌐 Processing ${pbmpUrls.length} URLs`)
    if (TEST_MODE) {
        console.log(`⚠️  TEST MODE: Will only process ${TEST_CHUNK_LIMIT} chunks`)
    }

    const collection = await db.collection(PBMP_COLLECTION)

    // Load and process each URL
    for (const url of pbmpUrls) {
        try {
            console.log(`\n📖 Loading: ${url}`)

            const loader = new PuppeteerWebBaseLoader(url, {
                launchOptions: {
                    headless: true,
                },
                gotoOptions: {
                    waitUntil: "domcontentloaded",
                },
                evaluate: async (page, browser) => {
                    const result = await page.evaluate(() => document.body.innerText)
                    await browser.close()
                    return result
                },
            })

            const docs = await loader.load()
            console.log(`   ✓ Content loaded (${docs[0].pageContent.length} characters)`)

            const chunks = await splitter.splitDocuments(docs)
            console.log(`   ✓ Split into ${chunks.length} chunks`)

            // In test mode, only process limited chunks
            const chunksToProcess = TEST_MODE ? chunks.slice(0, TEST_CHUNK_LIMIT) : chunks

            console.log(`   📊 Processing ${chunksToProcess.length} chunks...`)
            let processedCount = 0

            for (const chunk of chunksToProcess) {
                try {
                    const embedding = await geminiEmbeddings.embedQuery(chunk.pageContent)

                    await collection.insertOne({
                        $vector: embedding,
                        text: chunk.pageContent,
                        source: url,
                        metadata: chunk.metadata,
                    })

                    processedCount++
                    if (processedCount % 5 === 0) {
                        process.stdout.write(`   ⏳ Processed ${processedCount}/${chunksToProcess.length} chunks...\r`)
                    }
                } catch (chunkError) {
                    console.error(`   ❌ Error processing chunk: ${chunkError}`)
                }
            }

            console.log(`   ✅ Successfully processed ${processedCount} chunks from ${url}`)

        } catch (urlError) {
            console.error(`❌ Error loading ${url}:`, urlError)
            continue
        }
    }

    console.log('\n🎉 PBMP Knowledge Base Loading Complete!')
    console.log(`📊 Total URLs processed: ${pbmpUrls.length}`)
    if (TEST_MODE) {
        console.log(`⚠️  TEST MODE was enabled - only ${TEST_CHUNK_LIMIT} chunks per URL were processed`)
        console.log(`   Run without --test flag to process all content`)
    }
}

// Main execution
const main = async () => {
    try {
        console.log('🔧 Initializing...')
        await createCollection()
        await loadSampleData()
        console.log('✨ Done!')
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

main()

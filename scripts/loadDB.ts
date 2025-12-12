import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"
// When we create a collection in ASTA DB we can choose 1/3 metric types mentioned above.
// cosine is used to determine how similar two vectors are, and will be default when creating a collection. It does not require vectors to be normalized.
// The dot_product algo is about 50% faster than cosine but it will require vectors to be normalised.
// If we want to find out how close to vectors are the euclidean vectors are the most intuitive and commonly used metric.

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    GEMINI_API_KEY
} = process.env

// Validate required environment variables
if (!ASTRA_DB_NAMESPACE || !ASTRA_DB_COLLECTION || !ASTRA_DB_API_ENDPOINT ||
    !ASTRA_DB_APPLICATION_TOKEN || !GEMINI_API_KEY) {
    throw new Error('Missing required environment variables. Please check your .env file.')
}

// Initialize the Gemini Embedding model
// The 'embedding-001' model produces 768-dimensional vectors
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    model: "embedding-001",
})


const chatrc = [
    'https://www.rapidclaims.ai/',
]

// Test mode: set to true to only process first 3 chunks (saves API quota)
const TEST_MODE = process.env.TEST_MODE === 'true' || process.argv.includes('--test')
const TEST_CHUNK_LIMIT = 3

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE })

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512, // refers to the no of characters in each chunk
    chunkOverlap: 100, // refers to the overlapping characters between chunks this helps us to preserve cross chunk context
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                // Gemini's 'embedding-001' model produces 768-dimensional vectors
                dimension: 768,
                metric: similarityMetric
            }
        })
        console.log('Collection created successfully:', res)
    } catch (error: any) {
        if (error?.message?.includes('already exists') || error?.message?.toLowerCase().includes('already exists')) {
            console.log(`\n⚠️  Collection '${ASTRA_DB_COLLECTION}' already exists.`)
            console.log(`   If you're getting dimension mismatch errors, you need to delete this collection`)
            console.log(`   in Astra DB and run this script again to recreate it with 768 dimensions.\n`)
        } else {
            throw error
        }
    }
}

const loadSampleData = async () => {
    try {
        const collection = await db.collection(ASTRA_DB_COLLECTION)

        for (const url of chatrc) {
            console.log(`Scraping ${url}...`)
            const content = await scrapePage(url)

            if (!content || content.trim().length === 0) {
                console.warn(`No content scraped from ${url}`)
                continue
            }

            console.log(`Splitting content into chunks...`)
            const allChunks = await splitter.splitText(content)
            console.log(`Created ${allChunks.length} chunks`)

            // Apply test mode limit if enabled
            const chunks = TEST_MODE ? allChunks.slice(0, TEST_CHUNK_LIMIT) : allChunks
            if (TEST_MODE) {
                console.log(`🧪 TEST MODE: Processing only first ${TEST_CHUNK_LIMIT} chunks (out of ${allChunks.length})`)
                console.log(`   To process all chunks, remove --test flag or set TEST_MODE=false\n`)
            }

            // Test with a single embedding first to verify API works
            console.log('Testing embedding API with first chunk...')
            try {
                const testEmbedding = await geminiEmbeddings.embedQuery(chunks[0])
                console.log('Test embedding dimension:', testEmbedding?.length)
                console.log('Test embedding sample (first 5):', testEmbedding?.slice(0, 5))
                if (!testEmbedding || testEmbedding.length === 0) {
                    throw new Error('Test embedding returned empty result - check your API key and model configuration')
                }
            } catch (testError: any) {
                console.error('\n❌ Embedding API Error:', testError?.message || 'Unknown error')

                // Check for quota errors
                if (testError?.status === 429 || testError?.message?.includes('quota') || testError?.message?.includes('Quota exceeded')) {
                    console.error('\n⚠️  QUOTA EXCEEDED - Your Gemini API has reached its quota limit.')
                    console.error('   Solutions:')
                    console.error('   1. Wait for your daily quota to reset')
                    console.error('   2. Upgrade your Google AI Studio plan: https://ai.google.dev/pricing')
                    console.error('   3. Check your usage: https://ai.dev/usage?tab=rate-limit')
                    console.error('   4. The free tier may have 0 embedding requests - you may need to upgrade\n')
                } else if (testError?.message?.includes('API key') || testError?.status === 401) {
                    console.error('\n⚠️  API KEY ERROR - Check your GEMINI_API_KEY in .env file\n')
                }

                throw new Error(`Embedding API test failed: ${testError?.message || 'Unknown error'}`)
            }

            // Use the geminiEmbeddings client to get vectors for all chunks in one call
            console.log('Generating embeddings for all chunks...')
            let embeddings: any
            try {
                // Try embedDocuments first
                embeddings = await geminiEmbeddings.embedDocuments(chunks)
                console.log('Embeddings received, type:', typeof embeddings)
                console.log('Embeddings length:', embeddings?.length)

                // If embedDocuments returns empty arrays, fall back to embedQuery in a loop
                if (embeddings && embeddings.length > 0 && Array.isArray(embeddings[0]) && embeddings[0].length === 0) {
                    console.log('embedDocuments returned empty arrays, falling back to embedQuery...')
                    embeddings = []
                    for (let i = 0; i < chunks.length; i++) {
                        const embedding = await geminiEmbeddings.embedQuery(chunks[i])
                        embeddings.push(embedding)
                        if ((i + 1) % 10 === 0) {
                            console.log(`Generated ${i + 1}/${chunks.length} embeddings`)
                        }
                    }
                }
            } catch (embedError: any) {
                console.error('Error generating embeddings:', embedError)
                console.error('Error details:', embedError?.message)
                throw new Error(`Failed to generate embeddings: ${embedError?.message || 'Unknown error'}`)
            }

            // Validate embeddings
            if (!embeddings || embeddings.length === 0) {
                console.error('Embeddings result:', JSON.stringify(embeddings, null, 2))
                throw new Error('No embeddings generated')
            }

            // Debug: Log the structure of the first embedding
            console.log('First embedding type:', typeof embeddings[0])
            console.log('First embedding is array:', Array.isArray(embeddings[0]))
            if (embeddings[0]) {
                console.log('First embedding length:', Array.isArray(embeddings[0]) ? embeddings[0].length : 'N/A')
                console.log('First embedding sample (first 5 values):', Array.isArray(embeddings[0]) ? embeddings[0].slice(0, 5) : 'Not an array')
            } else {
                console.error('First embedding is null/undefined')
            }

            // Check first embedding dimension - handle different possible formats
            let firstEmbedding: number[] | any = embeddings[0]

            // Handle case where embeddings might be wrapped in objects
            if (firstEmbedding && typeof firstEmbedding === 'object' && !Array.isArray(firstEmbedding)) {
                // Check if it's an object with a values or embedding property
                if ('values' in firstEmbedding && Array.isArray((firstEmbedding as any).values)) {
                    firstEmbedding = (firstEmbedding as any).values
                } else if ('embedding' in firstEmbedding && Array.isArray((firstEmbedding as any).embedding)) {
                    firstEmbedding = (firstEmbedding as any).embedding
                } else {
                    // Try to convert object values to array
                    const values = Object.values(firstEmbedding)
                    if (values.length > 0 && typeof values[0] === 'number') {
                        firstEmbedding = values as number[]
                    }
                }
            }

            if (!Array.isArray(firstEmbedding) || firstEmbedding.length === 0) {
                console.error('Embedding structure:', JSON.stringify(embeddings[0], null, 2))
                throw new Error(`Invalid embedding format - expected array of numbers, got: ${typeof firstEmbedding}`)
            }

            const embeddingDimension = firstEmbedding.length
            console.log(`Embedding dimension: ${embeddingDimension}`)

            if (embeddingDimension !== 768) {
                console.warn(`Warning: Expected 768 dimensions, got ${embeddingDimension}`)
            }

            // Loop through the chunks and their corresponding embeddings
            console.log('Inserting documents into database...')
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i]
                let vector: number[] | any = embeddings[i]

                // Handle different embedding formats
                if (vector && typeof vector === 'object' && !Array.isArray(vector)) {
                    if ('values' in vector && Array.isArray((vector as any).values)) {
                        vector = (vector as any).values
                    } else if ('embedding' in vector && Array.isArray((vector as any).embedding)) {
                        vector = (vector as any).embedding
                    } else {
                        // Try to convert object values to array
                        const values = Object.values(vector)
                        if (values.length > 0 && typeof values[0] === 'number') {
                            vector = values as number[]
                        }
                    }
                }

                // Validate vector before insertion
                if (!vector || !Array.isArray(vector) || vector.length === 0) {
                    console.error(`Invalid vector at index ${i}:`, vector)
                    throw new Error(`Invalid vector at index ${i}`)
                }

                try {
                    await collection.insertOne({
                        $vector: vector,
                        text: chunk
                    })
                } catch (insertError: any) {
                    if (insertError?.errorDescriptors?.[0]?.errorCode === 'SHRED_BAD_VECTOR_SIZE') {
                        console.error(`\n❌ Vector dimension mismatch error!`)
                        console.error(`   Collection expects a different dimension than ${vector.length}`)
                        console.error(`   Your collection '${ASTRA_DB_COLLECTION}' was created with a different dimension.`)
                        console.error(`   Please delete the collection in Astra DB and run this script again,`)
                        console.error(`   or create a new collection with dimension ${vector.length}.\n`)
                        throw new Error('Vector dimension mismatch. Please delete and recreate the collection with dimension 768.')
                    }
                    throw insertError
                }

                if ((i + 1) % 10 === 0) {
                    console.log(`Inserted ${i + 1}/${chunks.length} chunks`)
                }
            }
            console.log(`Successfully loaded ${chunks.length} chunks from ${url}`)
        }
        console.log('Data loading completed!')
    } catch (error) {
        console.error('Error loading sample data:', error)
        throw error
    }
}

const scrapePage = async (url: string): Promise<string> => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page: any, browser: any) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    const scraped = await loader.scrape()
    // Use the regular expression to strip out the HTML tags from the page content
    return scraped?.replace(/<[^>]*>?/gm, '') || ''
}

// Main execution
const main = async () => {
    try {
        await createCollection()
        await loadSampleData()
        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

main()

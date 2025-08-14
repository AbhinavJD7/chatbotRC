// Removed incorrect imports from node_modules.
// The `type` imports are no longer needed as the core functionality has been updated.
import {DataAPIClient} from "@datastax/astra-db-ts"
import {PuppeteerWebBaseLoader} from "@langchain/community/document_loaders/web/puppeteer"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai" // Added this import for Gemini embeddings

import {RecursiveCharacterTextSplitter} from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"
// When we create a collection in ASTA DB we can choose 1/3 metric types mentioned above.
// cosine is used to determine how similar two vectors are, and will be default when creating a collection. It does not require vectors to be normalized.
// The dot_product algo is about 50% faster than cosine but it will require vectors to be normalised.
// If we want to find out how close to vectors are the euclidean vectors are the most intuitive and commonly used metric.

const { ASTRA_DB_NAMESPACE, 
        ASTRA_DB_COLLECTION,
        ASTRA_DB_API_ENDPOINT,    
        ASTRA_DB_APPLICATION_TOKEN,
        GEMINI_API_KEY
        } = process.env

// Replace the OpenAI client with the Gemini chat model
// Pass the API key and the desired model name
const gemini = new ChatGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  model: "gemini-1.5-pro" // Or another Gemini model like "gemini-1.5-pro"
})

// Initialize the Gemini Embedding model. 
// The default output dimension of 'embedding-001' is 3072, which matches the Astra DB collection.
const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    model: "embedding-001",
    // Explicitly set the output dimensionality to match the Astra DB collection
    //outputDimensionality: 3072,
})


const chatrc = [
    'https://www.rapidclaims.ai/',
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT , {namespace: ASTRA_DB_NAMESPACE})

const splitter  = new RecursiveCharacterTextSplitter({
    chunkSize: 512, // refers to the no of characters in each chunk
    chunkOverlap: 100, // refers to the overlapping characters between chunks this helps us to preserve cross chunk context
})

const createCollection = async(similarityMetric: SimilarityMetric = "dot_product") =>{
    const res = await db.createCollection(ASTRA_DB_COLLECTION,{
        vector:{
            // Gemini's text embedding model has a dimension of 3072
            dimension: 768,
            metric: similarityMetric
        }
    })
    console.log(res)
}

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await (const url of chatrc){
        const content  = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        
        // Use the geminiEmbeddings client to get vectors for all chunks in one call
        const embeddings = await geminiEmbeddings.embedDocuments(chunks)
        
        // Loop through the chunks and their corresponding embeddings
        for (let i = 0; i < chunks.length; i++){
            const chunk = chunks[i]
            const vector = embeddings[i]

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })
            console.log(res)
        }
    }
}

const scrapePage = async (url:string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions:{
            headless: true
        },
        gotoOptions:{
            waitUntil:"domcontentloaded"
        },
        evaluate: async(page , browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
    // we use the regular expression to strip out the HTML tags from the page content
  }
  
// Correctly call loadSampleData after the collection is created.
createCollection().then(loadSampleData)

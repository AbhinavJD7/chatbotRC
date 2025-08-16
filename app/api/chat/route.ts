import { Namespace } from './../../../node_modules/protobufjs/index.d';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import {OpenAIStream , StreamingTextResponse} from "ai"
import { DataAPIClient } from "@datastax/astra-db-ts"

const { ASTRA_DB_NAMESPACE, 
        ASTRA_DB_COLLECTION,
        ASTRA_DB_API_ENDPOINT,    
        ASTRA_DB_APPLICATION_TOKEN,
        GEMINI_API_KEY
        } = process.env

        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY
        })

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT,{namespace: ASTRA_DB_NAMESPACE})

export async Postpone(req: Request){
    try{

    }
    catch(err){
        
    }
}
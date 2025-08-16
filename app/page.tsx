"use client"
import Image from "next/image"
import RClogo from "./assets/RClogo.png"
import { useChat } from "@ai-sdk/react";
import Bubble from "./components/Bubble";
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import LoadingBubbles from "./components/LoadingBubbles";

// useChat hook from ai allows you to easily create a conversational user interface for the chatbot
// application, it enables the streaming of chat messages from your AI provider manage the state for chat
// input and update the UI automatically as a new messages are received.

//import { Message } from "ai"

const Home = () =>{
    const { append, isLoading, messages, input, handleInputChange, handleSubmit } = useChat();
    const noMessages = !messages || messages.length === 0
    const handlePrompt = ( promptText ) =>{
        const msg = {
            id:crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)

    }
    return (
        <main>
            <Image src = {RClogo} width={250} alt="RClogo"/>
            <section className={noMessages ? "" : "populated" }>
                {noMessages ? ( 
                    <>
                    <p className="starter-text">
                        RapidClaims is one of the fastest-growing RCM SaaS companies in the United States , 
                        replacing a patchwork of outdated tools with a single, 
                        AI-powered mid-cycle automation stack. We help healthcare providers cut 
                        denial rates by up to 42% , reduce coding costs by 70% , and turn revenue cycle management 
                        from a costly challenge into a strategic advantage 

                    </p>
                    <br/>
                    <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>
                ) :(
                    <>
                    {messages.map((message,index)=> <Bubble key={'message-${index}'} message = {message}/>)}
                    {isLoading && <LoadingBubbles/>}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                    <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something..."/>
                    <input type="submit"/>
                </form>
        </main>

    )
}
export default Home

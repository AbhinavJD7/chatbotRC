"use client"
import Image from "next/image"
import RClogo from "./assets/RClogo.png"
import { useChat } from '@ai-sdk/react'
import { useState, useEffect, useRef, ChangeEvent } from 'react'
import Bubble from "./components/Bubble"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow"
import LoadingBubbles from "./components/LoadingBubbles"

const Home = () => {
  // Explicitly specify the API endpoint
  const { messages, input, handleInputChange, handleSubmit, isLoading, sendMessage, error, setInput } = useChat({
    api: '/api/chat'
  })

  // Local state as fallback if useChat input doesn't work
  const [localInput, setLocalInput] = useState('')

  // Sync local input with useChat input
  useEffect(() => {
    if (input !== undefined) {
      setLocalInput(input)
    }
  }, [input])

  const noMessages = !messages || messages.length === 0

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current && !noMessages) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, noMessages])

  const handlePrompt = (promptText: string) => {
    if (promptText && promptText.trim()) {
      sendMessage({ text: promptText });
    }
  };

  // Handle input change with fallback
  const handleInputChangeSafe = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalInput(value)
    if (handleInputChange) {
      handleInputChange(e)
    } else if (setInput) {
      setInput(value)
    }
  };

  return (
    <main>
      <div className="header-section">
        <Image src={RClogo} width={250} alt="RapidClaims Logo" />
        {!noMessages && (
          <div className="chat-header-info">
            <span className="chat-status-indicator"></span>
            <span className="chat-status-text">AI Assistant Active</span>
          </div>
        )}
      </div>
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <div className="starter-text">
              <h2 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a202c',
                marginBottom: '20px',
                letterSpacing: '0.3px',
                lineHeight: '1.3'
              }}>
                30-Day Revenue Transformation
              </h2>
              <p style={{
                margin: 0,
                fontSize: '17px',
                lineHeight: '1.85',
                color: '#4a5568'
              }}>
                Our AI platform works alongside your team to transform revenue cycle operations
                while seamlessly integrating with your existing systems—delivering measurable
                results in just 30 days. We help healthcare providers cut denial rates by up to 42%,
                reduce coding costs by 70%, and turn revenue cycle management from a costly
                challenge into a strategic advantage.
              </p>
            </div>
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <PromptSuggestionsRow onPromptClick={handlePrompt} />
            </div>
          </>
        ) : (
          <>
            <div className="messages-container">
              {messages.map((message) => {
                // Handle different message formats from useChat
                const messageContent = typeof message.content === 'string'
                  ? message.content
                  : message.parts?.find((p: any) => p.type === 'text')?.text || '';

                return (
                  <Bubble
                    key={message.id}
                    message={{
                      content: messageContent,
                      role: message.role as 'user' | 'assistant',
                      id: message.id
                    }}
                  />
                );
              })}
              {isLoading && <LoadingBubbles />}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </section>

      <form onSubmit={(e) => {
        e.preventDefault()
        const textToSend = input || localInput
        if (textToSend && textToSend.trim()) {
          sendMessage({ text: textToSend })
          setLocalInput('')
          if (setInput) setInput('')
        }
      }}>
        <input
          className="question-box"
          onChange={handleInputChangeSafe}
          value={input !== undefined ? input : localInput}
          placeholder="Ask me something about RapidClaims..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !(input || localInput)?.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
        {error && (
          <div style={{
            color: '#dc2626',
            marginTop: '10px',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            ⚠️ Error: {error.message || 'An error occurred'}
          </div>
        )}
      </form>
    </main>
  )
}

export default Home
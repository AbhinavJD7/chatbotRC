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
  // useChat v2.0.15 doesn't provide input/handleInputChange - manage it manually
  const { messages, sendMessage, status, error, stop } = useChat({
    api: '/api/chat'
  })

  // Manage input state manually (useChat v2.0.15 doesn't provide input)
  const [input, setInput] = useState('')

  const noMessages = !messages || messages.length === 0
  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current && !noMessages) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, noMessages])

  const handlePrompt = (promptText: string) => {
    if (promptText && promptText.trim() && !isLoading) {
      sendMessage({ text: promptText.trim() });
    }
  };

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
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
                // Handle different message formats from useChat v2.0.15
                // Messages can have content as string or parts array
                let messageContent = '';

                if (typeof message.content === 'string') {
                  messageContent = message.content;
                } else if (message.parts && Array.isArray(message.parts)) {
                  // Handle parts array structure
                  const textPart = message.parts.find((part: { type?: string; text?: string }) =>
                    part.type === 'text' && part.text
                  );
                  messageContent = textPart?.text || '';
                } else {
                  messageContent = '';
                }

                // Ensure we have valid content
                if (!messageContent) {
                  return null;
                }

                return (
                  <Bubble
                    key={message.id || `msg-${Math.random()}`}
                    message={{
                      content: messageContent,
                      role: (message.role || 'user') as 'user' | 'assistant',
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
        const textToSend = input.trim()
        if (textToSend) {
          sendMessage({ text: textToSend })
          setInput('')
        }
      }}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something about RapidClaims..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
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
            ⚠️ Error: {error instanceof Error ? error.message : String(error) || 'An error occurred'}
            {status === 'error' && (
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginLeft: '12px',
                  padding: '4px 8px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Reload
              </button>
            )}
          </div>
        )}
      </form>
    </main>
  )
}

export default Home
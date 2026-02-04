"use client"
import Image from "next/image"
import RClogo from "../assets/RClogo.png"
import { useChat } from '@ai-sdk/react'
import { useState, useEffect, useRef, ChangeEvent } from 'react'
import Bubble from "../components/Bubble"
import PromptSuggestionsRow from "../components/PromptSuggestionsRow"
import LoadingBubbles from "../components/LoadingBubbles"

// Type definition for message structure from useChat
interface ChatMessage {
  id?: string;
  role?: 'user' | 'assistant';
  content?: string | { text?: string;[key: string]: unknown };
  text?: string;
  parts?: Array<{ type?: string; text?: string;[key: string]: unknown }>;
  [key: string]: unknown;
}

const WidgetPage = () => {
  // useChat v2.0.15 doesn't provide input/handleInputChange - manage it manually
  // Default endpoint is /api/chat, so no need to specify it
  const { messages, sendMessage, status, error, setMessages } = useChat({
    onError: (error) => {
      console.error('useChat error:', error);
    },
    onFinish: (message) => {
      console.log('Message finished:', message);
      // Access message properties safely with type assertion
      const msg = message as ChatMessage;
      console.log('Message content:', msg.content);
      console.log('Message parts:', msg.parts);
      console.log('Message role:', msg.role);
    }
  })

  // Manage input state manually (useChat v2.0.15 doesn't provide input)
  const [input, setInput] = useState('')

  // Track if we're in booking flow to prevent sending messages
  const [isInBookingFlow, setIsInBookingFlow] = useState(false)

  const noMessages = !messages || messages.length === 0
  const isLoading = status === 'streaming' || status === 'submitted'

  // Detect booking intent before sending
  const detectBookingIntent = (text: string): boolean => {
    const BOOKING_KEYWORDS = ['book', 'meeting', 'schedule', 'demo', 'appointment', 'call', 'talk', 'speak'];
    const lowerText = text.toLowerCase();
    return BOOKING_KEYWORDS.some(keyword => lowerText.includes(keyword));
  };

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

  // Handle new chat - reset to main menu
  const handleNewChat = () => {
    // Try to use setMessages if available, otherwise reload the page
    if (setMessages && typeof setMessages === 'function') {
      setMessages([]);
    } else {
      // Fallback: reload the page to reset
      window.location.reload();
    }
    setInput('');
  };

  return (
    <div className="widget-container">
      <div className="widget-header">
        <Image src={RClogo} width={180} alt="RapidClaims Logo" className="widget-logo" />
        {!noMessages && (
          <>
            <div className="chat-header-info">
              <span className="chat-status-indicator"></span>
              <span className="chat-status-text">AI Assistant Active</span>
            </div>
            <button
              onClick={handleNewChat}
              className="new-chat-button"
              disabled={isLoading}
              aria-label="Start new chat"
            >
              <span>New Chat</span>
            </button>
          </>
        )}
      </div>
      <section className={`widget-section ${noMessages ? "" : "populated"}`}>
        {noMessages ? (
          <>
            <div className="starter-text">
              <h2 className="starter-heading">
                30-Day Revenue Transformation
              </h2>
              <p className="starter-paragraph">
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
                // Use type assertion to access properties safely
                const msg = message as ChatMessage;
                let messageContent = '';

                // Try multiple ways to extract content
                if (typeof msg.content === 'string') {
                  messageContent = msg.content;
                } else if (msg.content && typeof msg.content === 'object') {
                  // Content might be an object with text property
                  const contentObj = msg.content as { text?: string;[key: string]: unknown };
                  messageContent = contentObj.text || String(contentObj) || '';
                } else if (msg.parts && Array.isArray(msg.parts)) {
                  // Handle parts array structure
                  type MessagePart = { type?: string; text?: string;[key: string]: unknown };
                  const textPart = msg.parts.find((part: MessagePart) =>
                    part.type === 'text' && part.text
                  );
                  messageContent = textPart?.text || '';

                  // If no text part found, try to get any text from parts
                  if (!messageContent) {
                    const anyTextPart = msg.parts.find((part: MessagePart) => part.text);
                    messageContent = anyTextPart?.text || '';
                  }
                } else if (msg.text) {
                  // Direct text property
                  messageContent = msg.text;
                } else {
                  // Last resort: try to stringify the content
                  messageContent = String(msg.content || '');
                }

                // Log for debugging if content is empty
                if (!messageContent && process.env.NODE_ENV === 'development') {
                  console.warn('Empty message content:', {
                    message: msg,
                    content: msg.content,
                    parts: msg.parts,
                    text: msg.text
                  });
                }

                // Check if this message should trigger booking flow
                // This happens when user sends a booking-related message
                const isBookingFlow = (msg as { bookingFlow?: boolean }).bookingFlow === true;
                const cleanContent = messageContent;

                // Ensure we have valid content or booking flow
                if ((!cleanContent || cleanContent.trim() === '') && !isBookingFlow) {
                  return null;
                }

                // Booking flow is handled by the bookingFlow flag in the message

                return (
                  <Bubble
                    key={msg.id || `msg-${Math.random()}`}
                    message={{
                      content: cleanContent,
                      role: (msg.role || 'user') as 'user' | 'assistant',
                      id: msg.id,
                      bookingFlow: isBookingFlow
                    }}
                    onBookingComplete={(data) => {
                      console.log('Booking completed:', data);
                      setIsInBookingFlow(false);
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
        if (textToSend && !isLoading && !isInBookingFlow) {
          // Check for booking intent before sending
          if (detectBookingIntent(textToSend)) {
            // Add user and assistant messages manually without calling API
            if (setMessages) {
              const userMsgId = `user-${Date.now()}`;
              const bookingMsgId = `booking-${Date.now()}`;

              setMessages((prevMessages) => {
                const newMessages = [...prevMessages];

                // Add user message manually
                const userMessage: ChatMessage = {
                  id: userMsgId,
                  role: 'user',
                  parts: [{
                    type: 'text',
                    text: textToSend
                  }]
                };
                newMessages.push(userMessage as typeof prevMessages[0]);

                // Add assistant booking message
                const bookingMessage: ChatMessage = {
                  id: bookingMsgId,
                  role: 'assistant',
                  parts: [{
                    type: 'text',
                    text: "I'd be happy to help you schedule a meeting! Let me collect a few details."
                  }],
                  bookingFlow: true
                };
                newMessages.push(bookingMessage as typeof prevMessages[0]);

                return newMessages;
              });

              setIsInBookingFlow(true);
            }
            setInput('');
            return;
          }

          console.log('Sending message:', textToSend)
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
    </div>
  )
}

export default WidgetPage

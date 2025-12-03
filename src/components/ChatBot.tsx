import React, { useEffect, useState, useRef } from "react";
import { getWebSocketUrl } from "../services/config";

interface Message {
  id: number;
  text: string;
  sender?: "user" | "bot";
  timestamp?: Date;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: "bot", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentBotMessageRef = useRef<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const socket = new WebSocket(getWebSocketUrl("/ws/v1/chat"));
    
    socket.onopen = () => {
      setIsConnected(true);
      setWs(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const msgType = data.type;

        switch (msgType) {
          case "connected":
            // Connection established - backend sends this on connect
            if (data.payload?.message) {
              console.log("Connected:", data.payload.message);
            }
            break;

          case "processing":
            // Backend is processing the request
            if (!currentBotMessageRef.current) {
              const botMessageId = Date.now();
              currentBotMessageRef.current = { id: botMessageId, text: "" };
              setMessages((prev) => [
                ...prev,
                { 
                  id: botMessageId, 
                  text: "...", 
                  sender: "bot", 
                  timestamp: new Date() 
                }
              ]);
            }
            break;

          case "delta":
            // Streaming response chunks
            if (data.payload?.v) {
              // Handle patch operations for streaming text
              if (Array.isArray(data.payload.v) && data.payload.o === "patch") {
                // Create bot message if it doesn't exist yet
                if (!currentBotMessageRef.current) {
                  const botMessageId = Date.now();
                  currentBotMessageRef.current = { id: botMessageId, text: "" };
                  setMessages((prev) => [
                    ...prev,
                    { 
                      id: botMessageId, 
                      text: "", 
                      sender: "bot", 
                      timestamp: new Date() 
                    }
                  ]);
                }
                
                data.payload.v.forEach((patch: any) => {
                  if (patch.o === "append" && patch.p === "/message/content/parts/0") {
                    const chunk = patch.v || "";
                    if (currentBotMessageRef.current) {
                      currentBotMessageRef.current.text += chunk;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === currentBotMessageRef.current!.id
                            ? { ...msg, text: currentBotMessageRef.current!.text || "..." }
                            : msg
                        )
                      );
                    }
                  }
                });
              } else if (data.payload.v?.message) {
                // Handle initial delta message structure (ignore for now as we create on "processing")
                // This is the message structure sent before patches
              }
            }
            break;

          case "delta_encoding":
            // Ignore delta_encoding messages (metadata for streaming)
            // These are sent before and during streaming but don't contain message content
            break;

          case "chat_done":
            // Chat response is complete
            currentBotMessageRef.current = null;
            break;

          case "error":
            // Error message from backend
            const errorText = data.error || data.payload?.error || "An error occurred";
            setMessages((prev) => [
              ...prev,
              { 
                id: Date.now(), 
                text: `Error: ${errorText}`, 
                sender: "bot", 
                timestamp: new Date() 
              }
            ]);
            currentBotMessageRef.current = null;
            break;

          default:
            // Handle other message types or fallback
            if (data.payload?.message) {
              setMessages((prev) => [
                ...prev,
                { 
                  id: Date.now(), 
                  text: data.payload.message, 
                  sender: "bot", 
                  timestamp: new Date() 
                }
              ]);
            }
            break;
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      setWs(null);
      currentBotMessageRef.current = null;
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim()) {
      // Reset current bot message reference for new conversation turn
      currentBotMessageRef.current = null;
      
      const userMessage: Message = {
        id: Date.now(),
        text: input.trim(),
        sender: "user",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, userMessage]);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Send message in the format expected by backend
        ws.send(JSON.stringify({
          type: "chat_message",
          payload: {
            content: input.trim()
          }
        }));
      } else {
        // Fallback: add a bot response if WebSocket is not connected
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, text: "WebSocket connection not available. Please check your connection.", sender: "bot", timestamp: new Date() }
          ]);
        }, 500);
      }
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-status">
        <span className={`chatbot-status-indicator ${isConnected ? "connected" : "disconnected"}`}></span>
        <span className="chatbot-status-text">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbot-message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
          >
            <div className="chatbot-message-content">
              {msg.text}
            </div>
            {msg.timestamp && (
              <div className="chatbot-message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input-container">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="chatbot-input"
          disabled={!isConnected}
        />
        <button
          onClick={sendMessage}
          className="chatbot-send-btn"
          disabled={!input.trim() || !isConnected}
          aria-label="Send message"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatBot;

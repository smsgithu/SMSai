import React, { useState } from "react";
import {
  Send,
  Home
} from "lucide-react";

import "./App.css";

/**
 * Initial welcome message
 */
const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hey! Welcome to Solana Made Simple. This app is running in demo mode visually, but responses are powered by a live AI backend.\n\nWhat would you like to learn about Solana today?"
};

export default function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Reset app to home state
   */
  const resetToHome = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setLoading(false);
  };

  /**
   * Handle sending a message (UI-only for now)
   */
  const handleSend = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // TEMP fallback until backend is fixed
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ The AI backend is currently being connected.\n\nYou’re seeing the correct UI behavior — once the API is live, responses will appear here automatically."
        }
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button
            className="home-button"
            onClick={resetToHome}
            title="Back to Home"
          >
            <Home size={18} />
          </button>

          <div>
            <h1 className="app-title">Solana Made Simple</h1>
            <p className="app-subtitle">Education First · AI Powered</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="chat-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.role === "user" ? "user-message" : "assistant-message"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="assistant-message opacity">
            Thinking…
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="input-container">
        <input
          type="text"
          placeholder="Ask anything about Solana…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
        />

        <button onClick={() => handleSend(input)}>
          <Send size={18} />
        </button>
      </footer>
    </div>
  );
}

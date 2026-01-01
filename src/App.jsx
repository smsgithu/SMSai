import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  BookOpen,
  Wallet,
  Coins,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hey! Welcome to Solana Made Simple. This app is running in demo mode visually, but responses are powered by a live AI backend. What would you like to learn about Solana today?",
};

export default function App() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { icon: Wallet, text: "How do I create a Solana wallet?" },
    { icon: Shield, text: "What are seed phrases?" },
    { icon: TrendingUp, text: "Explain DeFi and staking" },
    { icon: Coins, text: "What are Solana memecoins?" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    if (!text || loading) return;

    const updatedMessages = [...messages, { role: "user", content: text }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      console.log("🔥 Sending POST to /api/chat");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      console.log("📡 Status:", response.status);

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      const assistantReply =
        data?.content
          ?.filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n") || "No response returned.";

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "Something went wrong connecting to the AI. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input.trim());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col text-white">
      {/* Header */}
      <header className="bg-black/40 border-b border-purple-500/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Solana Made Simple</h1>
            <p className="text-sm text-purple-300">
              Education First · AI Powered
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="mr-3 mt-1">
                  <BookOpen className="w-5 h-5 text-purple-300" />
                </div>
              )}
              <div
                className={`max-w-xl rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600"
                    : "bg-white/10 border border-white/20"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-purple-300" />
              <span className="text-purple-300 text-sm">
                Thinking…
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p.text)}
                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 transition"
              >
                <p.icon className="w-5 h-5" />
                {p.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="bg-black/40 border-t border-purple-500/30 px-4 py-4"
      >
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about Solana…"
            disabled={loading}
            className="flex-1 rounded-xl bg-white/10 px-5 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3"
          >
            <Send />
          </button>
        </div>
      </form>
    </div>
  );
}

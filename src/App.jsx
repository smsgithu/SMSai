import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "GM 👋 Welcome to Solana Made Simple.\n\nAsk me anything about Solana — wallets, staking, DeFi, safety, or how this ecosystem actually works.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // DEMO RESPONSE (replace later with real API call)
      const demoReply = {
        role: "assistant",
        content:
          "This is demo mode 🤖\n\nEventually this will be powered by AI trained specifically on Solana education.\n\nFor now, you’re looking at the shipped MVP.",
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, demoReply]);
        setLoading(false);
      }, 800);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
      setLoading(false);
    }
  };

  const handleHome = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "GM 👋 Welcome back to Solana Made Simple.\n\nAsk me anything about Solana — wallets, staking, DeFi, safety, or ecosystem basics.",
      },
    ]);
    setInput("");
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0b0b0b",
        color: "#ffffff",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #222",
        }}
      >
        <h2 style={{ margin: 0 }}>Solana Made Simple</h2>

        <button
          onClick={handleHome}
          style={{
            background: "#14f195",
            color: "#000",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Home
        </button>
      </header>

      {/* CHAT */}
      <main
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "12px",
              whiteSpace: "pre-wrap",
              color: msg.role === "assistant" ? "#e5e5e5" : "#14f195",
            }}
          >
            <strong>{msg.role === "assistant" ? "SMS AI" : "You"}:</strong>{" "}
            {msg.content}
          </div>
        ))}

        {loading && <div>Thinking…</div>}
      </main>

      {/* INPUT */}
      <footer
        style={{
          padding: "12px",
          borderTop: "1px solid #222",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Solana..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />

        <button
          onClick={handleSend}
          style={{
            background: "#14f195",
            color: "#000",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Send
        </button>
      </footer>
    </div>
  );
}

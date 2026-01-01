const res = await fetch("/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    messages: newMessages
  })
});

const data = await res.json();

if (!res.ok) {
  throw new Error("API error");
}

const assistantText =
  data?.content?.[0]?.text ||
  "No response returned.";

setMessages([
  ...newMessages,
  { role: "assistant", content: assistantText }
]);

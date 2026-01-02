import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, BookOpen, Wallet, Coins, TrendingUp, Shield, Sparkles } from 'lucide-react';

const SolanaAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 🌟 Welcome to **Solana Made Simple AI**—\n\nYour guide to the Solana ecosystem — from wallets and seed phrases to staking, DeFi, memecoins, RWAs, and how Solana actually works under the hood.\n\nType: Just ask me anything about Solana!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { icon: Wallet, text: 'How do wallets work?' },
    { icon: Shield, text: 'What is a seed phrase?' },
    { icon: TrendingUp, text: 'Explain DeFi and staking' },
    { icon: Coins, text: 'How do Solana memecoins work?' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    
    if (!userMessage || loading) return;

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.content 
      }]);
    } catch (error) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-lg border-b border-purple-500/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Solana Made Simple</h1>
            <p className="text-sm text-purple-300">Your AI Guide to the Solana Eco

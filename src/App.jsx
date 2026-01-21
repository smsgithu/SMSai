import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Wallet, Sparkles, Send, Home, User, LogOut, Loader2, Twitter, Youtube, Video, Instagram, Linkedin, Calendar, ChevronDown, ExternalLink, MessageSquare, Plus, Trash2, Gift, Trophy, Medal, X } from 'lucide-react';
import { getWallets } from '@wallet-standard/app';
import {   
  createDefaultAuthorizationCache,   
  createDefaultChainSelector,   
  createDefaultWalletNotFoundHandler,  
  registerMwa,   
} from '@solana-mobile/wallet-standard-mobile';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 🌟 Welcome to smsai.fun\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [solPrice, setSolPrice] = useState(null);
  const [btcPrice, setBtcPrice] = useState(null);
  const [smsPrice, setSmsPrice] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('');
  const [userXP, setUserXP] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [showWalletPrompt, setShowWalletPrompt] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [standardWallets, setStandardWallets] = useState([]);
  const messagesEndRef = useRef(null);
  const hasTrackedSession = useRef(false);

  // Initialize wallet standard detection
  useEffect(() => {
    const { get, on } = getWallets();
    
    // Get initial wallets
    const wallets = get();
    setStandardWallets(wallets);
    
    // Listen for new wallets
    const removeListener = on('register', () => {
      setStandardWallets(get());
    });
    
    return () => removeListener();
  }, []);

  // Register MWA for Solana Mobile
  useEffect(() => {
    registerMwa({  
      appIdentity: { name: 'SMSai', uri: 'https://smsai.fun', icon: '/icon-512.png' },      
      authorizationCache: createDefaultAuthorizationCache(),  
      chains: ['solana:mainnet'],
      chainSelector: createDefaultChainSelector(),  
      onWalletNotFound: createDefaultWalletNotFoundHandler(),  
    });
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Find Jupiter wallet from wallet standard
  const findJupiterWallet = useCallback(() => {
    return standardWallets.find(w => 
      w.name?.toLowerCase().includes('jupiter') || 
      w.name?.toLowerCase() === 'jup'
    );
  }, [standardWallets]);

  // Find MWA/Seed Vault wallet from wallet standard
  const findMwaWallet = useCallback(() => {
    return standardWallets.find(w => 
      w.name?.toLowerCase().includes('mobile wallet adapter') || 
      w.name?.toLowerCase().includes('seed vault') ||
      w.name?.toLowerCase().includes('mwa')
    );
  }, [standardWallets]);

  const walletOptions = useMemo(() => [
    { id: 'seedvault', name: 'Seed Vault', useStandard: true, isMwa: true },
    { id: 'jupiter', name: 'Jupiter', useStandard: true, mobileLink: 'https://jup.ag/onboard', downloadUrl: 'https://chromewebstore.google.com/detail/jupiter-wallet/iledlaeogohbilgbfhmbgkgmpplbfboh' },
    { id: 'phantom', name: 'Phantom', window: 'solana', check: (w) => w?.isPhantom, mobileLink: 'https://phantom.app/ul/browse/https://smsai.fun', downloadUrl: 'https://phantom.app/' },
    { id: 'solflare', name: 'Solflare', window: 'solflare', check: (w) => !!w, mobileLink: 'https://solflare.com/ul/v1/browse/https://smsai.fun', downloadUrl: 'https://solflare.com/' },
    { id: 'backpack', name: 'Backpack', window: 'backpack', check: (w) => w?.isBackpack || (w && typeof w.connect === 'function'), mobileLink: 'https://backpack.app/ul/browse/https://smsai.fun', downloadUrl: 'https://backpack.app/' },
  ], []);

  const syncUserData = async (walletAddr, updates = {}) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddr, wallet_type: updates.wallet_type || walletType || 'unknown', xp: updates.xp !== undefined ? updates.xp : userXP, questions_asked: updates.questions_asked !== undefined ? updates.questions_asked : questionCount })
      });
      if (!response.ok) throw new Error(`Sync failed: ${response.status}`);
      return (await response.json()).user;
    } catch (error) { console.error('Sync error:', error); throw error; }
  };

  const loadUserData = async (walletAddr) => {
    try {
      const response = await fetch(`/api/user?wallet_address=${walletAddr}`);
      if (!response.ok) { if (response.status === 404) return null; throw new Error(`Load failed: ${response.status}`); }
      return (await response.json()).user;
    } catch (error) { console.error('Load error:', error); return null; }
  };

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const response = await fetch('/api/leaderboard');
      if (response.ok) setLeaderboard((await response.json()).leaderboard || []);
    } catch (error) { console.error('Failed to load leaderboard:', error); }
    finally { setLeaderboardLoading(false); }
  };

  const openLeaderboard = () => { setShowLeaderboard(true); loadLeaderboard(); };

  const loadChats = async (walletAddr) => {
    try {
      const response = await fetch(`/api/chats?wallet_address=${walletAddr}`);
      if (response.ok) setSavedChats((await response.json()).chats || []);
    } catch (error) { console.error('Failed to load chats:', error); }
  };

  const saveCurrentChat = async () => {
    if (!walletConnected || messages.length <= 1) return;
    const title = messages.find(m => m.role === 'user')?.content.slice(0, 50) || 'New Chat';
    try {
      const response = await fetch('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: walletAddress, chat_id: currentChatId, title: title + (title.length >= 50 ? '...' : ''), messages }) });
      if (response.ok) { setCurrentChatId((await response.json()).chat_id); loadChats(walletAddress); }
    } catch (error) { console.error('Failed to save chat:', error); }
  };

  const loadChat = (chat) => { setMessages(chat.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))); setCurrentChatId(chat.id); setShowChatHistory(false); };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    try { await fetch(`/api/chats?chat_id=${chatId}&wallet_address=${walletAddress}`, { method: 'DELETE' }); setSavedChats(savedChats.filter(c => c.id !== chatId)); if (currentChatId === chatId) resetChat(); }
    catch (error) { console.error('Failed to delete chat:', error); }
  };

  const startNewChat = () => { if (walletConnected && messages.length > 1) saveCurrentChat(); setCurrentChatId(null); resetChat(); setShowChatHistory(false); };

  const socialLinks = [
    { name: 'X', url: 'https://x.com/smsonx', Icon: Twitter, label: '@smsonx' },
    { name: 'X', url: 'https://x.com/solmadesimple', Icon: Twitter, label: '@solmadesimple' },
    { name: 'YouTube', url: 'https://www.youtube.com/@SMSONYOUTUBE', Icon: Youtube, label: 'YouTube' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@solanamadesimple', Icon: Video, label: 'TikTok' },
    { name: 'Instagram', url: 'https://www.instagram.com/smscrypto', Icon: Instagram, label: 'Insta' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/sean-suvie-77a35018b/', Icon: Linkedin, label: 'LinkedIn' },
    { name: 'Book Call', url: 'https://calendly.com/seanmsuvie/30min', Icon: Calendar, label: "Let's chat!" }
  ];

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const shortenAddress = (address) => `${address.slice(0, 4)}...${address.slice(-4)}`;
  const isInWalletBrowser = () => !!(window.solana?.isPhantom || window.solflare || window.backpack || findJupiterWallet());

  useEffect(() => {
    if (!hasTrackedSession.current) {
      hasTrackedSession.current = true;
      const trackVisit = async () => {
        try {
          const alreadyCounted = sessionStorage.getItem('smsai_visit_counted');
          if (!alreadyCounted) { const response = await fetch('/api/visits', { method: 'POST' }); setSessionCount((await response.json()).count); sessionStorage.setItem('smsai_visit_counted', 'true'); }
          else { setSessionCount((await (await fetch('/api/visits')).json()).count); }
        } catch (error) { console.error('Failed to track visit:', error); setSessionCount(0); }
      };
      trackVisit();
      const savedWallet = localStorage.getItem('smsai_wallet');
      const savedWalletType = localStorage.getItem('smsai_wallet_type');
      if (savedWallet) {
        loadUserData(savedWallet).then(userData => {
          if (userData) { setWalletAddress(savedWallet); setWalletType(savedWalletType || 'unknown'); setWalletConnected(true); setUserXP(userData.xp || 0); setQuestionCount(userData.questions_asked || 0); loadChats(savedWallet); }
          else { localStorage.removeItem('smsai_wallet'); localStorage.removeItem('smsai_wallet_type'); }
        });
      }
    }
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const cgData = await (await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin&vs_currencies=usd&include_24hr_change=true')).json();
        setSolPrice({ price: cgData.solana.usd, change: cgData.solana.usd_24h_change });
        setBtcPrice({ price: cgData.bitcoin.usd, change: cgData.bitcoin.usd_24h_change });
        const dexData = await (await fetch('https://api.dexscreener.com/latest/dex/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS')).json();
        if (dexData.pairs?.length > 0) setSmsPrice({ price: parseFloat(dexData.pairs[0].priceUsd), change: parseFloat(dexData.pairs[0].priceChange?.h24 || 0) });
      } catch (error) { console.error('Failed to fetch prices:', error); }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (walletConnected && messages.length > 1) { const timeout = setTimeout(() => saveCurrentChat(), 3000); return () => clearTimeout(timeout); } }, [messages, walletConnected]);

  const connectWallet = async (walletName) => {
    try {
      const walletConfig = walletOptions.find(w => w.id === walletName);
      if (!walletConfig) { alert('Unknown wallet type.'); return; }

      let publicKey;

      // Handle Seed Vault / MWA via wallet standard
      if (walletConfig.isMwa) {
        const mwaWallet = findMwaWallet();
        if (!mwaWallet) {
          alert('Seed Vault / Mobile Wallet Adapter not available.\n\nThis wallet is only available on Solana Mobile devices with Seed Vault enabled.');
          return;
        }
        
        // Connect using wallet standard
        const connectFeature = mwaWallet.features['standard:connect'];
        if (!connectFeature) throw new Error('Wallet does not support connect');
        
        const result = await connectFeature.connect();
        if (result.accounts && result.accounts.length > 0) {
          publicKey = result.accounts[0].address;
        } else {
          throw new Error('No accounts returned');
        }
      }
      // Handle Jupiter via wallet standard
      else if (walletConfig.useStandard) {
        const jupiterWallet = findJupiterWallet();
        if (!jupiterWallet) {
          if (isMobile && walletConfig.mobileLink) { window.location.href = walletConfig.mobileLink; return; }
          window.open(walletConfig.downloadUrl, '_blank');
          alert(`${walletConfig.name} not detected.\n\n1. Install from the opened page\n2. Refresh this page\n3. Try again`);
          return;
        }
        
        // Connect using wallet standard
        const connectFeature = jupiterWallet.features['standard:connect'];
        if (!connectFeature) throw new Error('Wallet does not support connect');
        
        const result = await connectFeature.connect();
        if (result.accounts && result.accounts.length > 0) {
          publicKey = result.accounts[0].address;
        } else {
          throw new Error('No accounts returned');
        }
      } else {
        // Handle other wallets via window object
        const walletObj = window[walletConfig.window];
        if (!walletObj || !walletConfig.check(walletObj)) {
          if (isMobile && walletConfig.mobileLink) { window.location.href = walletConfig.mobileLink; return; }
          window.open(walletConfig.downloadUrl, '_blank');
          alert(`${walletConfig.name} not detected.\n\n1. Install from the opened page\n2. Refresh this page\n3. Try again`);
          return;
        }
        const response = await walletObj.connect();
        publicKey = walletName === 'solflare' ? (walletObj.publicKey || response?.publicKey) : (response?.publicKey || walletObj.publicKey);
        if (publicKey && typeof publicKey !== 'string') {
          publicKey = publicKey.toString();
        }
      }

      if (!publicKey) throw new Error('Could not find public key');
      const address = typeof publicKey === 'string' ? publicKey : publicKey.toString();
      
      const userData = await loadUserData(address);
      let newXP = 0, newQuestionCount = 0, message = '';
      if (userData) { 
        newXP = userData.xp || 0; 
        newQuestionCount = userData.questions_asked || 0; 
        message = `Welcome back! You have ${newXP} XP`; 
      } else { 
        newXP = 20; 
        newQuestionCount = 0; 
        try { 
          await syncUserData(address, { wallet_type: walletName, xp: 20, questions_asked: 0 }); 
          message = 'Wallet connected! +20 XP welcome bonus'; 
        } catch { 
          alert('Connected but failed to save to database. You may need to reconnect.'); 
          return; 
        } 
      }
      
      setWalletAddress(address); 
      setWalletConnected(true); 
      setWalletType(walletName); 
      setUserXP(newXP); 
      setQuestionCount(newQuestionCount);
      setShowWalletPrompt(false); 
      setShowWalletMenu(false);
      localStorage.setItem('smsai_wallet', address); 
      localStorage.setItem('smsai_wallet_type', walletName);
      setConnectionMessage(message); 
      setTimeout(() => setConnectionMessage(''), 5000);
      loadChats(address);
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) alert('Connection cancelled.');
      else if (error.code === 4001) alert('Connection rejected. Please approve in your wallet.');
      else alert(`Connection failed: ${error.message || 'Unknown error'}`);
    }
  };

  const disconnectWallet = () => {
    if (messages.length > 1) saveCurrentChat();
    setWalletConnected(false); setWalletAddress(''); setWalletType(''); setUserXP(0); setQuestionCount(0); setShowWalletMenu(false); setSavedChats([]); setCurrentChatId(null);
    localStorage.removeItem('smsai_wallet'); localStorage.removeItem('smsai_wallet_type');
  };

  const handleSubmit = async (promptText = null) => {
    const userMessage = promptText || input.trim();
    if (!userMessage || loading) return;
    if (!walletConnected && questionCount >= 5) { setShowWalletPrompt(true); return; }
    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date() }];
    setMessages(newMessages); setInput(''); setLoading(true);
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);
    if (walletConnected && walletAddress) { const newXP = userXP + 5; setUserXP(newXP); syncUserData(walletAddress, { xp: newXP, questions_asked: newQuestionCount }).catch(() => {}); }
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content })), wallet_address: walletAddress || null }) });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'API request failed');
      setMessages([...newMessages, { role: 'assistant', content: data.content || "I received your message but couldn't generate a response. Please try again.", timestamp: new Date() }]);
    } catch (error) { console.error('Chat error:', error); setMessages([...newMessages, { role: 'assistant', content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.", timestamp: new Date() }]); }
    finally { setLoading(false); }
  };

  const resetChat = () => setMessages([{ role: 'assistant', content: "👋 🌟 Welcome to smsai.fun\n\nYour AI guide to the Solana ecosystem. We break things down simply—from wallets and seed phrases to staking, DeFi, RWAs, memecoins, and how Solana actually works under the hood.\n\nAsk me anything about Solana.", timestamp: new Date() }]);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-400" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-300" />;
    if (index === 2) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-purple-300 w-4 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {connectionMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
          <div className="bg-green-600/30 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg border border-green-400/50 flex items-center gap-2 justify-center">
            <span>🎉</span><span className="font-semibold text-sm">{connectionMessage}</span>
            <button onClick={() => setConnectionMessage('')} className="ml-1 text-white/80 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg sm:text-xl flex items-center gap-2"><Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />XP Leaderboard</h2>
              <button onClick={() => setShowLeaderboard(false)} className="text-purple-300 hover:text-white p-1"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {leaderboardLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-300" /></div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-purple-300 text-sm">No users yet. Be the first to earn XP!</p>
                  {!walletConnected && <button onClick={() => { setShowLeaderboard(false); setShowWalletPrompt(true); }} className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-4 py-2 font-semibold text-sm">Connect Wallet to Start</button>}
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((user, index) => (
                    <div key={user.wallet_address} className={`flex items-center justify-between p-3 rounded-xl ${walletAddress === user.wallet_address ? 'bg-purple-600/40 border border-purple-500/50' : 'bg-white/5 hover:bg-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-6 flex justify-center">{getRankIcon(index)}</div>
                        <div><span className="text-white text-sm font-mono">{shortenAddress(user.wallet_address)}</span>{walletAddress === user.wallet_address && <span className="ml-2 text-xs text-purple-300">(you)</span>}</div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-purple-300 text-xs">{user.questions_asked || 0} Q's</span>
                        <span className="text-yellow-400 font-bold text-sm">{user.xp || 0} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-purple-500/30">
              <button onClick={loadLeaderboard} disabled={leaderboardLoading} className="w-full bg-white/10 text-purple-200 rounded-lg px-4 py-2 font-medium hover:bg-white/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {leaderboardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔄'} Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatHistory && walletConnected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 w-72 max-w-[80vw] h-full border-r border-purple-500/30 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Chat History</h3>
              <button onClick={() => setShowChatHistory(false)} className="text-purple-300 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <button onClick={startNewChat} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-3 py-2 font-semibold text-sm flex items-center justify-center gap-2 mb-4"><Plus className="w-4 h-4" /> New Chat</button>
            {savedChats.length === 0 ? <p className="text-purple-300 text-sm text-center">No saved chats yet</p> : (
              <div className="space-y-2">
                {savedChats.map((chat) => (
                  <div key={chat.id} onClick={() => loadChat(chat)} className={`p-3 rounded-lg cursor-pointer group ${currentChatId === chat.id ? 'bg-purple-600/30 border border-purple-500/50' : 'bg-white/5 hover:bg-white/10'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0"><p className="text-white text-sm truncate">{chat.title}</p><p className="text-purple-300 text-xs">{new Date(chat.updated_at).toLocaleDateString()}</p></div>
                      <button onClick={(e) => deleteChat(chat.id, e)} className="text-purple-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1" onClick={() => setShowChatHistory(false)} />
        </div>
      )}

      {showWalletPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-purple-500/30 rounded-2xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto relative">
            <button onClick={() => setShowWalletPrompt(false)} className="absolute top-3 right-3 text-purple-300 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3"><Wallet className="w-6 h-6 text-white" /></div>
              <h2 className="text-lg font-bold text-white mb-2">Connect or Create Wallet</h2>
              <p className="text-purple-200 text-sm mb-2">You've explored 5 questions! 🎉 To keep learning about Solana, Web3, and crypto, connect your wallet.</p>
              <p className="text-xs text-purple-300/80 mb-4">It's 100% free, takes 30 seconds, and unlocks unlimited questions + XP rewards.</p>
              {isMobile && !isInWalletBrowser() && <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2 mb-3"><p className="text-xs text-blue-200">📱 Tap a wallet to open this site in that wallet's browser</p></div>}
              
              {/* Seed Vault / MWA - shown prominently when available */}
              {findMwaWallet() && (
                <div className="bg-green-800/30 border border-green-500/30 rounded-xl p-3 mb-4">
                  <p className="text-xs text-green-300 font-medium mb-2">📱 Solana Mobile Detected!</p>
                  <button onClick={() => connectWallet('seedvault')} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl px-4 py-3 font-semibold hover:from-green-500 hover:to-emerald-500 flex items-center justify-center gap-2 text-sm">
                    <Wallet className="w-4 h-4" />Connect with Seed Vault
                  </button>
                </div>
              )}
              
              <div className="bg-purple-800/30 border border-purple-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-white font-medium mb-2">{findMwaWallet() ? 'Or select another wallet:' : 'Already have a wallet? Select it below:'}</p>
                <div className="space-y-2">
                  {walletOptions.filter(w => !w.isMwa).map((wallet) => (
                    <button key={wallet.id} onClick={() => connectWallet(wallet.id)} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-4 py-2.5 font-semibold hover:from-purple-500 hover:to-pink-500 flex items-center justify-center gap-2 text-sm">
                      <Wallet className="w-4 h-4" />{wallet.name}{isMobile && !isInWalletBrowser() && !wallet.isMwa && <ExternalLink className="w-3 h-3 opacity-60" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-purple-500/30"></div></div><div className="relative flex justify-center text-xs"><span className="bg-gradient-to-br from-slate-900 to-purple-900 px-2 text-purple-300">Need to create a wallet?</span></div></div>
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-3 mb-3">
                <h3 className="text-white font-semibold text-sm mb-2 flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" />Create Your First Wallet (2 min)</h3>
                <ol className="text-xs text-purple-200 space-y-1.5 text-left">
                  <li className="flex gap-2"><span className="font-bold text-purple-400">1.</span><span>Tap any wallet above to visit their website</span></li>
                  <li className="flex gap-2"><span className="font-bold text-purple-400">2.</span><span>Install the browser extension or mobile app</span></li>
                  <li className="flex gap-2"><span className="font-bold text-purple-400">3.</span><span>Create a new wallet (takes 30 seconds)</span></li>
                  <li className="flex gap-2"><span className="font-bold text-purple-400">4.</span><span>Save your seed phrase securely (never share it!)</span></li>
                  <li className="flex gap-2"><span className="font-bold text-purple-400">5.</span><span>Return here and connect</span></li>
                </ol>
                <p className="text-[10px] text-purple-300/80 italic mt-2">💡 Your wallet is free, requires no personal info, and you don't need any crypto to create it.</p>
              </div>
              <button onClick={() => setShowWalletPrompt(false)} className="w-full bg-white/10 text-purple-200 rounded-xl px-4 py-2 font-medium hover:bg-white/20 text-sm">Maybe Later</button>
              <p className="text-[10px] text-purple-300/60 mt-3">100% free • No transactions • Just sign-in</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black/60 backdrop-blur-md border-b border-purple-500/20 px-3 py-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-1.5">
            <div className="bg-gradient-to-r from-yellow-600/20 via-orange-600/20 to-yellow-600/20 border border-yellow-500/40 rounded-full px-3 py-1 animate-pulse">
              <p className="text-[9px] sm:text-xs text-yellow-300 text-center flex items-center gap-1.5"><Gift className="w-3 h-3 sm:w-4 sm:h-4" /><span><span className="font-bold">USDC Bounties Coming</span> • Holders Only • Community Rewards 🎁</span></p>
            </div>
          </div>
          <div className="flex justify-center items-center gap-2 sm:gap-6 mb-1.5 overflow-x-auto">
            {solPrice && <div className="flex items-center gap-1 flex-shrink-0"><span className="text-purple-300 font-semibold text-[10px] sm:text-xs">$SOL</span><span className="text-white font-bold text-[10px] sm:text-xs">${solPrice.price.toFixed(2)}</span><span className={`text-[9px] sm:text-[10px] ${solPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{solPrice.change >= 0 ? '↑' : '↓'}{Math.abs(solPrice.change).toFixed(1)}%</span></div>}
            {btcPrice && <div className="flex items-center gap-1 flex-shrink-0"><span className="text-orange-300 font-semibold text-[10px] sm:text-xs">$BTC</span><span className="text-white font-bold text-[10px] sm:text-xs">${(btcPrice.price / 1000).toFixed(1)}k</span><span className={`text-[9px] sm:text-[10px] ${btcPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{btcPrice.change >= 0 ? '↑' : '↓'}{Math.abs(btcPrice.change).toFixed(1)}%</span></div>}
            {smsPrice && <div className="flex items-center gap-1 flex-shrink-0"><a href="https://jup.ag/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS" target="_blank" rel="noopener noreferrer" className="text-pink-400 font-semibold text-[10px] sm:text-xs hover:text-pink-300">$SMS</a><span className="text-white font-bold text-[10px] sm:text-xs">${smsPrice.price < 0.01 ? smsPrice.price.toFixed(6) : smsPrice.price.toFixed(4)}</span><span className={`text-[9px] sm:text-[10px] ${smsPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{smsPrice.change >= 0 ? '↑' : '↓'}{Math.abs(smsPrice.change).toFixed(1)}%</span><a href="https://jup.ag/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-semibold">Buy</a></div>}
          </div>
          <div className="flex justify-center"><div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-full px-2 py-0.5"><p className="text-[9px] sm:text-xs text-green-300 text-center">✨ <span className="font-semibold">100% Free</span> • 5 questions • Connect wallet for unlimited</p></div></div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center px-3 sm:px-4 pt-3 sm:pt-6 pb-4 overflow-y-auto">
        <div className="w-full max-w-4xl">
          <div className="block sm:hidden mb-3">
            <div className="flex items-center gap-2 mb-2">
              {walletConnected && <button onClick={() => setShowChatHistory(true)} className="flex items-center gap-1 p-1.5 bg-purple-600/30 rounded-lg border border-purple-500/30"><MessageSquare className="w-4 h-4 text-purple-300" /><span className="text-[9px] text-purple-300">History</span></button>}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-white" /></div>
              <div className="flex-1 min-w-0"><h1 className="text-base font-bold text-white leading-tight">smsai.fun</h1><p className="text-[10px] text-purple-300">Your AI Guide to Solana</p></div>
              {walletConnected ? (
                <button onClick={() => setShowWalletMenu(!showWalletMenu)} className="flex items-center gap-1 bg-purple-600/30 px-2 py-1 rounded-lg border border-purple-500/30"><User className="w-3 h-3 text-purple-300" /><span className="text-[9px] text-white">{shortenAddress(walletAddress)}</span><ChevronDown className="w-3 h-3 text-purple-300" /></button>
              ) : <button onClick={() => setShowWalletPrompt(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1"><Wallet className="w-3 h-3" />Connect</button>}
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <a href="https://jup.ag/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-black/40 border border-pink-500/30 px-2 py-0.5 rounded-full"><span className="text-[8px] text-purple-300">Powered by</span><img src="/sms.png" alt="$SMS" className="h-3 w-auto" /></a>
                <span className="text-[9px] text-purple-300">👁️ {sessionCount}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">{socialLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-white"><link.Icon className="w-3.5 h-3.5" /></a>)}</div>
            </div>
            {showWalletMenu && walletConnected && <div className="absolute right-3 top-28 bg-slate-900 border border-purple-500/30 rounded-lg shadow-lg z-50"><div className="px-3 py-1.5 border-b border-purple-500/20 text-[10px] text-purple-300">{userXP} XP • {questionCount} questions</div><button onClick={disconnectWallet} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"><LogOut className="w-3 h-3" />Disconnect</button></div>}
          </div>

          <div className="hidden sm:block">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                {walletConnected && <button onClick={() => setShowChatHistory(true)} className="flex items-center gap-2 p-2 bg-purple-600/30 rounded-xl border border-purple-500/30 hover:bg-purple-600/50" title="Chat History"><MessageSquare className="w-5 h-5 text-purple-300" /><span className="text-xs text-purple-300">Chat History</span></button>}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles className="w-6 h-6 text-white" /></div>
                <div><h1 className="text-2xl font-bold text-white">smsai.fun</h1><p className="text-sm text-purple-300">Your AI Guide to the Solana Ecosystem</p></div>
              </div>
              <div className="flex items-center gap-3">{socialLinks.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-0.5 text-purple-300 hover:text-white group"><link.Icon className="w-4 h-4" /><span className="text-[9px] group-hover:text-white">{link.label}</span></a>)}</div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <a href="https://jup.ag/tokens/A9FmiDpt5UMwuvJgR759RJMEHdXzwwymyisMNfxvBAGS" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/40 border border-pink-500/30 px-3 py-1.5 rounded-full hover:border-pink-500/50"><span className="text-[10px] text-purple-300">Powered by</span><img src="/sms.png" alt="$SMS" className="h-5 w-auto" /></a>
                <div className="text-xs text-purple-300">👁️ {sessionCount} visits</div>
              </div>
              <div className="relative">
                {walletConnected ? (
                  <div className="relative">
                    <button onClick={() => setShowWalletMenu(!showWalletMenu)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 px-3 py-2 rounded-xl border border-purple-500/30 hover:border-purple-500/50"><User className="w-4 h-4 text-purple-300" /><div className="text-left"><div className="text-xs text-white font-medium">{shortenAddress(walletAddress)}</div><div className="text-[10px] text-purple-300">{userXP} XP • {questionCount} questions</div></div><ChevronDown className="w-4 h-4 text-purple-300" /></button>
                    {showWalletMenu && <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-purple-500/30 rounded-xl shadow-lg z-50 min-w-[160px]"><button onClick={disconnectWallet} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"><LogOut className="w-4 h-4" />Disconnect</button></div>}
                  </div>
                ) : <button onClick={() => setShowWalletPrompt(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-pink-500 flex items-center gap-2"><Wallet className="w-4 h-4" />Connect Wallet</button>}
              </div>
            </div>
          </div>

          {messages.length === 1 && (
            <div className="mb-3 sm:mb-6">
              <p className="text-[10px] sm:text-sm text-purple-300 mb-2 text-center">Quick start:</p>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-3 max-w-2xl mx-auto">
                <button onClick={() => handleSubmit('How do wallets work?')} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-[10px] sm:text-base text-left flex items-center gap-1.5 sm:gap-3"><Wallet className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" /><span>How do wallets work?</span></button>
                <button onClick={() => handleSubmit('What is a seed phrase?')} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-[10px] sm:text-base text-left flex items-center gap-1.5 sm:gap-3"><Sparkles className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" /><span>What is a seed phrase?</span></button>
                <button onClick={() => handleSubmit('Explain DeFi and staking')} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-[10px] sm:text-base text-left flex items-center gap-1.5 sm:gap-3"><Sparkles className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" /><span>DeFi and staking</span></button>
                <button onClick={() => handleSubmit('How do Solana memecoins work?')} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-[10px] sm:text-base text-left flex items-center gap-1.5 sm:gap-3"><Sparkles className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" /><span>Solana memecoins</span></button>
              </div>
            </div>
          )}

          <div className="space-y-2 sm:space-y-4 mb-20 sm:mb-24 max-w-2xl mx-auto">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"><Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div>}
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                  <div className={`rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-2 sm:py-3 ${message.role === 'user' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-white/10 text-white'}`}><ReactMarkdown className="prose prose-invert prose-sm max-w-none text-xs sm:text-base [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">{message.content}</ReactMarkdown></div>
                  <div className="text-[9px] sm:text-xs text-purple-300/60 mt-0.5 px-1">{formatTime(message.timestamp)}</div>
                </div>
                {message.role === 'user' && <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0"><User className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div>}
              </div>
            ))}
            {loading && <div className="flex gap-2"><div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" /></div><div className="bg-white/10 rounded-xl px-3 py-2"><Loader2 className="w-4 h-4 animate-spin text-purple-300" /></div></div>}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-purple-500/20 p-2 sm:p-4">
        <div className="max-w-2xl mx-auto">
          {!walletConnected && questionCount > 0 && questionCount < 5 && <div className="mb-1.5 text-center"><span className="inline-block bg-purple-600/30 text-purple-200 text-[9px] sm:text-xs px-2 py-0.5 rounded-full">{5 - questionCount} free questions left</span></div>}
          {!walletConnected && questionCount >= 5 && (
            <div className="mb-2 text-center">
              <div className="inline-flex flex-col items-center gap-1 bg-purple-600/30 border border-purple-500/30 text-purple-100 text-[10px] sm:text-sm px-3 py-2 rounded-lg">
                <span>🎉 5 free questions used!</span>
                <button onClick={() => setShowWalletPrompt(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-lg font-semibold flex items-center gap-1 text-[10px] sm:text-sm"><Wallet className="w-3 h-3" />Connect to Continue</button>
              </div>
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-1.5 sm:gap-2">
            {messages.length > 1 && <button type="button" onClick={startNewChat} className="bg-purple-600/50 hover:bg-purple-600 text-white p-2 sm:p-3 rounded-lg sm:rounded-xl" title="New Chat"><Home className="w-4 h-4 sm:w-5 sm:h-5" /></button>}
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={!walletConnected && questionCount >= 5 ? "Connect wallet..." : "Ask about Solana..."} disabled={loading || (!walletConnected && questionCount >= 5)} className="flex-1 bg-white/10 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 px-3 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm" />
            <button type="submit" disabled={loading || !input.trim() || (!walletConnected && questionCount >= 5)} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}</button>
          </form>
          <div className="flex justify-center items-center gap-2 sm:gap-3 mt-2 text-[9px] sm:text-xs text-purple-400">
            <a href="/privacy.html" className="hover:text-white">Privacy</a>
            <span>•</span>
            <a href="/terms.html" className="hover:text-white">Terms</a>
            <span>•</span>
            <a href="/copyright.html" className="hover:text-white">Copyright</a>
            <span>•</span>
            <button onClick={openLeaderboard} className="flex items-center gap-1 bg-gradient-to-r from-yellow-600/30 to-orange-600/30 hover:from-yellow-600/50 hover:to-orange-600/50 border border-yellow-500/40 px-2 py-0.5 rounded-full text-yellow-300 hover:text-yellow-200 font-medium transition-all">
              <Trophy className="w-3 h-3" />
              <span>Leaderboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const TextChat = ({ onBack }) => {
  const [status, setStatus] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState('terms');
  const [activeSparks, setActiveSparks] = useState([]);

  const triggerSparkEffect = () => {
    const newSparks = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: Math.random() * 80 + 10,
      delay: Math.random() * 0.6,
      scale: Math.random() * 0.8 + 0.6,
      rotation: Math.random() * 60 - 30,
      emoji: ['💖', '❤️', '✨', '🔥', '🌸', '💘'][Math.floor(Math.random() * 6)]
    }));
    setActiveSparks(prev => [...prev, ...newSparks]);
    setTimeout(() => {
      setActiveSparks(prev => prev.filter(spark => !newSparks.some(n => n.id === spark.id)));
    }, 4000);
  };

  const sendHeartSpark = () => {
    if (socketRef.current && status === 'connected') {
      socketRef.current.emit('spark:heart');
      triggerSparkEffect();
    }
  };

  const handleReportUser = (reason) => {
    if (socketRef.current) {
      socketRef.current.emit('report:user', { reason });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(false);
        nextChat();
      }, 1500);
    }
  };

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  let typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    socketRef.current = io(socketUrl);
    
    socketRef.current.on('chat:start', () => {
      setStatus('connected');
      addSystemMessage('Match found! Speak your heart.');
    });
    
    socketRef.current.on('message', (data) => {
      setMessages(prev => [...prev, data]);
    });
    
    socketRef.current.on('typing', (isTyping) => {
      setPartnerTyping(isTyping);
    });
    
    socketRef.current.on('partner:disconnected', () => {
      setStatus('disconnected');
      addSystemMessage('Stranger left the conversation.');
    });
    
    socketRef.current.on('spark:heart', () => {
      triggerSparkEffect();
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const startChat = () => {
    setStatus('waiting');
    setMessages([]);
    socketRef.current.emit('text:start');
    addSystemMessage('Searching for your connection...');
  };

  const sendMessage = () => {
    if (inputMessage.trim() && status === 'connected') {
      const messageData = {
        message: inputMessage,
        sender: 'me',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, messageData]);
      socketRef.current.emit('message', { message: inputMessage });
      setInputMessage('');
      socketRef.current.emit('typing', false);
    }
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (e.target.value.length > 0 && status === 'connected') {
      socketRef.current.emit('typing', true);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', false);
      }, 1000);
    } else {
      socketRef.current.emit('typing', false);
    }
  };

  const nextChat = () => {
    setStatus('waiting');
    setMessages([]);
    socketRef.current.emit('next');
    addSystemMessage('Searching for a new connection...');
  };

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      message: text,
      sender: 'system',
      timestamp: Date.now()
    }]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const StatusBadge = () => {
    const config = {
      idle: { text: 'Not Connected', color: 'bg-white/5 border border-white/10 text-gray-400' },
      waiting: { text: 'Searching...', color: 'bg-pink-500/10 border border-pink-500/20 text-pink-400 animate-pulse' },
      connected: { text: 'Matched ❤️', color: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' },
      disconnected: { text: 'Disconnected', color: 'bg-rose-500/10 border border-rose-500/20 text-rose-400' }
    };
    
    const current = config[status];
    return (
      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${current.color} backdrop-blur-md shadow-lg`}>
        {status === 'waiting' && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping"></span>}
        {status === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>}
        <span className="text-xs font-semibold tracking-wider uppercase">{current.text}</span>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#080711] overflow-hidden flex flex-col justify-between font-sans">
      
      {/* Spark overlay container */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {activeSparks.map((spark) => (
          <div
            key={spark.id}
            className="absolute bottom-0 animate-flySpark text-3xl select-none"
            style={{
              left: `${spark.x}%`,
              animationDelay: `${spark.delay}s`,
              transform: `scale(${spark.scale}) rotate(${spark.rotation}deg)`,
            }}
          >
            {spark.emoji}
          </div>
        ))}
      </div>

      {/* Background Decorative Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[45%] h-[45%] bg-gradient-to-br from-violet-600/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[45%] h-[45%] bg-gradient-to-tr from-pink-600/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Glassmorphic Navigation Header */}
      <header className="relative w-full z-20 border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={onBack} 
              className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white transition duration-300 font-medium text-sm group mr-1.5 sm:mr-2"
            >
              <span className="transform group-hover:-translate-x-1 transition duration-300">←</span> Back
            </button>
            <button 
              onClick={() => setShowPolicy(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white text-[10px] font-semibold uppercase tracking-wider transition backdrop-blur shadow"
            >
              🛡️ Safety Policy
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3">
            <img 
              src="/twinpulse-logo.png" 
              className="w-7 h-7 rounded-full border border-pink-500/20 shadow-[0_0_10px_rgba(255,42,95,0.25)]" 
              alt="TwinPulse mini logo" 
            />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 font-extrabold text-xl hidden sm:inline">TwinPulse Text</span>
            <span className="text-xs text-white/20 hidden sm:inline">|</span>
            <StatusBadge />
          </div>

          <div>
            {status === 'connected' && (
              <button
                onClick={nextChat}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-3.5 py-2 sm:px-5 rounded-xl transition duration-300 shadow-[0_4px_15px_rgba(244,63,94,0.3)] text-xs uppercase tracking-wider"
              >
                <span className="hidden sm:inline">Next Spark ⚡</span>
                <span className="sm:hidden">Next ⚡</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 z-10 flex flex-col justify-center h-full">
        
        {/* LOBBY / SEARCHING STATE */}
        {status === 'idle' && (
          <div className="text-center py-8 sm:py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl sm:rounded-[36px] backdrop-blur-md p-6 sm:p-10 max-w-xl mx-auto w-full shadow-2xl">
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-6 sm:mb-8 rounded-full border border-violet-500/20 p-1 flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-pink-500/10 group shadow-[0_0_30px_rgba(124,58,237,0.25)]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-pink-600 animate-pulse opacity-20"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-pink-600 animate-ping opacity-15" style={{ animationDuration: '3s' }}></div>
                  <div className="w-full h-full rounded-full overflow-hidden border border-white/10 relative">
                    <img 
                      src="/text-chat-ill.png" 
                      className="w-full h-full object-cover object-center transform group-hover:scale-110 transition duration-500" 
                      alt="Text chat spark"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 sm:mb-3">Anonymous Text Spark</h2>
            <p className="text-gray-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed mb-6 sm:mb-8">
              Skip the face reveals. Dive directly into rich, seductive conversations where only words matter.
            </p>
            <button
              onClick={startChat}
              className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-md transition duration-300 shadow-[0_5px_25px_rgba(244,63,94,0.3)] tracking-wider uppercase"
            >
              Start Chatting ❤️
            </button>
          </div>
        )}

        {status === 'waiting' && (
          <div className="text-center py-8 sm:py-20 bg-white/[0.02] border border-white/[0.06] rounded-2xl sm:rounded-[36px] backdrop-blur-md p-6 sm:p-10 max-w-xl mx-auto w-full shadow-2xl relative">
            
            {/* Seductive pulsing rings */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-pink-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-2 rounded-full border border-violet-500/20 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 blur-[8px] opacity-20"></div>
              
              {/* Central Pulsing Heart */}
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
                <span className="text-xl sm:text-2xl text-white">❤️</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 tracking-tight">Searching for a Match...</h2>
            <p className="text-gray-400 text-[10px] sm:text-xs tracking-wider animate-pulse mb-6 sm:mb-8">FINDING SOMEONE WITH SIMILAR VIBES</p>
            
            <button
              onClick={() => setStatus('idle')}
              className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl border border-white/10 text-xs transition duration-300 uppercase tracking-widest"
            >
              Cancel Match
            </button>
          </div>
        )}

        {/* CHAT INTERFACE */}
        {(status === 'connected' || status === 'disconnected' || (status === 'waiting' && messages.length > 0)) && (
          <div className="flex-1 bg-white/[0.02] border border-white/[0.06] rounded-2xl sm:rounded-[32px] backdrop-blur-md overflow-hidden flex flex-col min-h-[350px] h-[calc(100dvh-150px)] sm:h-[520px] shadow-2xl">
            
            {/* Messages Pane */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'me' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  {msg.sender === 'system' ? (
                    <div className="bg-white/[0.04] border border-white/[0.06] text-gray-400 text-[11px] font-medium tracking-wide uppercase px-4 py-1.5 rounded-full shadow">
                      {msg.message}
                    </div>
                  ) : (
                    <div className={`max-w-[75%] p-3.5 rounded-2xl shadow-lg relative group transition duration-300 ${
                      msg.sender === 'me' 
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-tr-none' 
                        : 'bg-white/[0.07] border border-white/[0.05] text-gray-100 rounded-tl-none'
                    }`}>
                      <p className="text-sm font-normal leading-relaxed break-words">{msg.message}</p>
                      
                      {/* Sub-text timestamp */}
                      <span className="block text-[9px] opacity-50 mt-1.5 text-right font-light">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {partnerTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/[0.05] px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            {status === 'connected' && (
              <div className="border-t border-white/[0.06] p-3 sm:p-4 bg-white/[0.01]">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 transition transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-1.5"
                    title="Report Abuse / Safety Violation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Report</span>
                  </button>

                  <button
                    onClick={sendHeartSpark}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/20 text-pink-400 transition transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-1.5"
                    title="Send Chemistry Spark (Heart Burst) ❤️"
                  >
                    <span className="text-base sm:text-lg animate-pulse">💖</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Spark</span>
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleTyping}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Whisper something attractive..."
                    className="flex-1 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] text-white text-xs md:text-sm rounded-xl sm:rounded-2xl px-3 sm:px-5 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition placeholder-gray-500"
                  />
                  
                  <button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold px-4 sm:px-6 rounded-xl sm:rounded-2xl transition duration-300 shadow-[0_4px_15px_rgba(244,63,94,0.3)] flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {status === 'disconnected' && (
              <div className="p-5 text-center border-t border-white/[0.06] bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-4">
                <span className="text-gray-400 text-xs">Don't worry, thousands of cute singles are waiting!</span>
                <button
                  onClick={startChat}
                  className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition duration-300 uppercase tracking-wider shadow-[0_4px_15px_rgba(244,63,94,0.3)]"
                >
                  Spark Again ⚡
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Safety Guideline Footer */}
      <footer className="relative z-10 w-full text-center py-6 text-[10px] text-gray-600 font-light max-w-xl mx-auto">
        If things feel uncomfortable, press the Back button. Report bad behaviors immediately.
      </footer>
      {/* Dynamic Glass Report/Abuse Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0e0d21] border border-white/[0.08] rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl p-6 relative animate-fadeIn">
            <h3 className="text-lg font-extrabold text-white mb-2 flex items-center gap-2">
              <span className="text-rose-500">⚠️</span> Report Current User
            </h3>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Filing a report immediately disconnects the connection and initiates a new matchmaking skip. Frequent violations lead to permanent bans.
            </p>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                  ✓
                </div>
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Report Filed Successfully</p>
                <p className="text-gray-500 text-[10px]">Finding your next match...</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  '🤬 Harassment, Abuse or Bullying',
                  '🔞 Inappropriate/Sexual Talk',
                  '🤖 Bot, Spam or Promotion',
                  '👶 Underage User (< 18)',
                  '🛑 Scam or Malicious Links'
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleReportUser(reason)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-rose-500/30 text-gray-300 hover:text-white transition duration-200 text-xs font-medium"
                  >
                    {reason}
                  </button>
                ))}

                <button
                  onClick={() => setShowReportModal(false)}
                  className="w-full mt-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRIVACY & COMMUNITY SAFETY MODAL */}
      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[#0e0d21] border border-white/[0.08] rounded-[36px] w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h3 className="text-xl font-extrabold text-white">Trust, Safety & Policies</h3>
              </div>
              <button 
                onClick={() => setShowPolicy(false)}
                className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Glassmorphic Tab Selector Navigation */}
            <div className="px-6 pt-4 flex border-b border-white/[0.04] bg-white/[0.005] gap-2 overflow-x-auto">
              {[
                { id: 'terms', label: 'Terms & Conditions', icon: '📜' },
                { id: 'privacy', label: 'Privacy Policy', icon: '🔒' },
                { id: 'security', label: 'Security & Blocking', icon: '⚡' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePolicyTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs md:text-sm font-semibold tracking-wide transition duration-300 whitespace-nowrap ${
                    activePolicyTab === tab.id
                      ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-6 text-gray-300 text-xs md:text-sm leading-relaxed max-h-[50vh]">
              
              {/* Tab 1: Terms & Conditions */}
              {activePolicyTab === 'terms' && (
                <div className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-pink-400">🔞</span> 1. User Consent & 18+ Verification
                    </h4>
                    <p className="text-gray-400 text-xs">
                      By accessing TwinPulse, you explicitly warrant that you are at least 18 years of age. Underage access is strictly prohibited and immediately blocked from accessing our WebRTC nodes.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-pink-400">🤝</span> 2. Respectful Community Conduct
                    </h4>
                    <p className="text-gray-400 text-xs">
                      TwinPulse is built to foster authentic connections. Any user who conducts cyberbullying, verbal abuse, hate speech, harassment, threats, or explicit sexual aggression is in breach of this agreement.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-pink-400">🚫</span> 3. Anti-Spam & Brand Safety
                    </h4>
                    <p className="text-gray-400 text-xs">
                      Commercial advertising, sharing scam links, robotic script profiles, or distributing malicious content is heavily forbidden. Violators will face immediate automatic blockage.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Privacy Policy */}
              {activePolicyTab === 'privacy' && (
                <div className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-violet-400">🔒</span> 1. Ephemeral Incognito Architecture
                    </h4>
                    <p className="text-gray-400 text-xs">
                      We operate on a zero-logs policy. No text logs, camera frames, voice feeds, or personal identifiers are written to disk, databases, or third-party analytical pipelines.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-violet-400">📡</span> 2. Secure Direct WebRTC Match
                    </h4>
                    <p className="text-gray-400 text-xs">
                      Audio and video streams are mediated via secure end-to-end direct WebSockets and WebRTC P2P signaling paths, meaning data stays completely isolated between your matching partner and you.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-violet-400">🛡️</span> 3. Cookie & Tracking Isolation
                    </h4>
                    <p className="text-gray-400 text-xs">
                      TwinPulse does not utilize advertising tracking cookies, browser pixel tags, or user identity logging. Once your tab closes, all trace of your session vanishes permanently.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Security & Blocking */}
              {activePolicyTab === 'security' && (
                <div className="space-y-4">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-rose-400">🛡️</span> 1. Real-time Purple Shield Protection
                    </h4>
                    <p className="text-gray-400 text-xs">
                      Clicking the **⚠️ Report** button on any chat interface immediately initiates session severance. The socket link is instantly isolated, and the reporter is recycled back into the match queue.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-rose-500/10 rounded-2xl p-4">
                    <h4 className="text-rose-400 font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-rose-400">🛑</span> 2. Automated Hardware IP Blockage
                    </h4>
                    <p className="text-gray-400 text-xs">
                      We have integrated automatic threshold security blocking. Accounts/IPs that gather recurring reports or flag severe violations (nudity, cyberbullying, scams) will face a **permanent hardware network block**.
                    </p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                      <span className="text-rose-400">⚡</span> 3. Encrypted Signaling Logs
                    </h4>
                    <p className="text-gray-400 text-xs">
                      WebSockets exchange signaling variables with temporary key tokens. Any attempt to inject malicious code or scan the sockets terminates the signaling channel instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* End Note */}
              <div className="text-center text-xs text-gray-500 font-light mt-4">
                By using TwinPulse, you agree to treat other unique souls with mutual dignity, empathy, and respect.
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-white/[0.06] bg-white/[0.01] flex justify-end">
              <button 
                onClick={() => setShowPolicy(false)}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-6 py-2.5 rounded-xl transition text-xs shadow-lg"
              >
                I Understand & Agree
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TextChat;
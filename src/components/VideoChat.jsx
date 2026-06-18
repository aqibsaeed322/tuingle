import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';

const VideoChat = ({ onBack }) => {
  const [status, setStatus] = useState('idle');
  const [myStream, setMyStream] = useState(null);
  const [partnerStream, setPartnerStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [myLocation, setMyLocation] = useState({ country: '', flag: '', code: '' });
  const [partnerLocation, setPartnerLocation] = useState({ country: '', flag: '', code: '' });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('any');
  const [myInterest, setMyInterest] = useState('😊 Just Chat');
  const [showInterestSelector, setShowInterestSelector] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [showChat, setShowChat] = useState(true);
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


  const myVideoRef = useRef(null);
  const partnerVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const messagesEndRef = useRef(null);
  let typingTimeoutRef = useRef(null);

  const countries = [
    { code: 'any', name: 'Any Country', flag: '🌍' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  ];

  const interests = [
    '😊 Just Chat', '💬 Friends', '💕 Dating', '🎮 Gaming',
    '🎵 Music', '🎬 Movies', '📚 Study', '💼 Business',
    '🧘 Meditation', '🍕 Food', '🏀 Sports', '🐱 Pets'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    socketRef.current = io(socketUrl);

    const apiKey = import.meta.env.VITE_IPGEOLOCATION_API_KEY;
    if (apiKey) {
      axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`)
        .then((response) => {
          const { country_name, country_code2 } = response.data;
          setMyLocation({ 
            country: country_name, 
            code: country_code2,
            flag: `https://flagcdn.com/w40/${country_code2.toLowerCase()}.png` 
          });
        })
        .catch(() => setMyLocation({ country: 'Unknown', code: 'UN', flag: '' }));
    }

    socketRef.current.on('chat:start', (data) => {
      if (data.type === 'video') {
        setStatus('connected');
        addSystemMessage('Connection established. Say Hello!');
      }
    });

    socketRef.current.on('video:initiate', async ({ partnerId }) => {
      await initiateCall(partnerId);
    });

    socketRef.current.on('video:offer', async ({ sdp, from }) => {
      await handleOffer(sdp, from);
    });

    socketRef.current.on('video:answer', ({ sdp }) => {
      if (peerRef.current) peerRef.current.signal(sdp);
    });

    socketRef.current.on('video:ice-candidate', ({ candidate }) => {
      if (peerRef.current) peerRef.current.signal(candidate);
    });

    socketRef.current.on('partner:disconnected', () => {
      endCall();
      setStatus('disconnected');
      addSystemMessage('Partner disconnected');
    });

    socketRef.current.on('partner:location', (location) => {
      setPartnerLocation(location);
    });

    socketRef.current.on('chat:message', (message) => {
      setMessages((prev) => [...prev, { 
        sender: 'Stranger', 
        text: message,
        timestamp: Date.now(),
        isSystem: false
      }]);
    });

    socketRef.current.on('typing', (isTyping) => {
      setPartnerTyping(isTyping);
    });

    socketRef.current.on('spark:heart', () => {
      triggerSparkEffect();
    });

    return () => cleanup();
  }, []);

  // Sync local camera stream with my video element
  useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
      myVideoRef.current.onloadedmetadata = () => {
        myVideoRef.current.play().catch(e => console.log("My video play error:", e));
      };
    }
  }, [myStream, status]);

  // Sync partner stream with partner video element
  useEffect(() => {
    if (partnerVideoRef.current && partnerStream) {
      partnerVideoRef.current.srcObject = partnerStream;
      partnerVideoRef.current.onloadedmetadata = () => {
        partnerVideoRef.current.play().catch(e => console.log("Partner video play error:", e));
      };
    }
  }, [partnerStream, status]);

  const sendMessage = () => {
    if (newMessage.trim() !== '' && status === 'connected') {
      setMessages((prev) => [...prev, {
        text: newMessage,
        sender: 'You',
        timestamp: Date.now(),
        isSystem: false
      }]);
      socketRef.current.emit('chat:message', newMessage);
      setNewMessage('');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit('typing', false);
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && e.target.value.length > 0 && status === 'connected') {
      setIsTyping(true);
      socketRef.current.emit('typing', true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socketRef.current.emit('typing', false);
      }
    }, 1000);
  };

  const addSystemMessage = (text) => {
    setMessages((prev) => [...prev, {
      text: text,
      sender: 'System',
      timestamp: Date.now(),
      isSystem: true
    }]);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: newFacingMode } },
          audio: true
        });
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        if (peerRef.current) {
          const sender = peerRef.current._pc.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
        }
      } catch (err) {
        console.error("Camera switch error:", err);
      }
    }
  };

  const startVideoChat = async () => {
    setCameraError(null);
    setIsRequesting(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 1.333333 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setMyStream(stream);
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.onloadedmetadata = () => {
          myVideoRef.current.play().catch(e => console.log("Play error:", e));
        };
      }
      
      setStatus('waiting');
      addSystemMessage('Finding a connection...');
      socketRef.current.emit('video:start', {
        country: selectedCountry,
        interest: myInterest
      });
      
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(error.message);
      alert('Please allow camera and microphone access');
    } finally {
      setIsRequesting(false);
    }
  };

  const initiateCall = async (partnerId) => {
    if (!myStream) {
      console.error("No local stream available");
      return;
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: myStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data) => {
      socketRef.current.emit('video:offer', { sdp: data, to: partnerId });
    });

    peer.on('stream', (stream) => {
      console.log("Received partner stream");
      setPartnerStream(stream);
      if (partnerVideoRef.current) {
        partnerVideoRef.current.srcObject = stream;
        partnerVideoRef.current.play().catch(e => console.log(e));
      }
    });

    peer.on('connect', () => {
      console.log("Peer connected");
      socketRef.current.emit('partner:location', myLocation);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      addSystemMessage('Connection error. Trying next match...');
    });

    peerRef.current = peer;
  };

  const handleOffer = async (sdp, from) => {
    if (!myStream) return;
    
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: myStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data) => {
      socketRef.current.emit('video:answer', { sdp: data, to: from });
    });

    peer.on('stream', (stream) => {
      console.log("Received partner stream from offer");
      setPartnerStream(stream);
      if (partnerVideoRef.current) partnerVideoRef.current.srcObject = stream;
    });

    peer.signal(sdp);
    peerRef.current = peer;
  };

  const toggleMute = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleCamera = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        setIsCameraOff(!isCameraOff);
      }
    }
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (myStream) {
      myStream.getTracks().forEach((track) => track.stop());
      setMyStream(null);
      if (myVideoRef.current) myVideoRef.current.srcObject = null;
    }
    setPartnerStream(null);
    if (partnerVideoRef.current) partnerVideoRef.current.srcObject = null;
    setStatus('idle');
    if (socketRef.current) socketRef.current.emit('next');
  };

  const stopChat = () => {
    endCall();
    setStatus('idle');
    setMessages([]);
  };

  const nextChat = () => {
    endCall();
    setMessages([]);
    setStatus('waiting');
    addSystemMessage('Finding a new connection...');
    startVideoChat();
  };

  const cleanup = () => {
    if (socketRef.current) socketRef.current.disconnect();
    endCall();
  };

  const getCountryFlag = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    return country ? country.flag : '🌍';
  };

  const StatusBadge = () => {
    const config = {
      idle: { text: 'Not Connected', color: 'bg-white/5 border border-white/10 text-gray-400' },
      waiting: { text: 'Matching...', color: 'bg-pink-500/10 border border-pink-500/20 text-pink-400 animate-pulse' },
      connected: { text: 'Matched ❤️', color: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' },
      disconnected: { text: 'Disconnected', color: 'bg-rose-500/10 border border-rose-500/20 text-rose-400' }
    };
    const current = config[status];
    return (
      <div className={`flex items-center gap-2 px-4 py-1 rounded-full border ${current.color} backdrop-blur-md shadow-lg`}>
        {status === 'waiting' && <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping"></span>}
        {status === 'connected' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>}
        <span className="text-[10px] font-bold tracking-widest uppercase">{current.text}</span>
      </div>
    );
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#080711] flex flex-col font-sans">
      
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
      <div className="absolute top-[-10%] left-[-15%] w-[45%] h-[45%] bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[45%] h-[45%] bg-gradient-to-tr from-pink-600/10 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Bar */}
      <header className="relative w-full z-20 border-b border-white/[0.06] bg-[#0c0b1e]/60 backdrop-blur-md px-4 py-2 sm:px-6 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white transition duration-300 font-medium text-sm group mr-1.5 sm:mr-2"
          >
            <span className="transform group-hover:-translate-x-1 transition duration-300">←</span> Back
          </button>
          <img 
            src="/twinpulse-logo.png" 
            className="w-7 h-7 rounded-full border border-pink-500/20 shadow-[0_0_10px_rgba(255,42,95,0.25)]" 
            alt="TwinPulse mini logo" 
          />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 font-extrabold text-lg mr-2 hidden sm:inline">TwinPulse Video ❤️</span>
          <button 
            onClick={() => setShowPolicy(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white text-[10px] font-semibold uppercase tracking-wider transition backdrop-blur shadow-lg"
          >
            🛡️ Safety Policy
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Settings / Preference Toggles */}
          {status === 'idle' && (
            <div className="flex gap-2">
              {/* Interest Selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowInterestSelector(!showInterestSelector); setShowCountrySelector(false); }}
                  className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white px-3 py-1.5 sm:px-4 rounded-full flex items-center gap-1.5 sm:gap-2 transition text-xs font-semibold backdrop-blur"
                >
                  <span>💡</span>
                  <span className="hidden sm:inline">{myInterest}</span>
                  <span className="sm:hidden">{myInterest.split(' ')[0]}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showInterestSelector && (
                  <div className="absolute right-0 top-full mt-2 bg-[#0e0d21] border border-white/[0.08] rounded-2xl shadow-2xl w-48 max-h-64 overflow-y-auto z-50 p-2">
                    {interests.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => {
                          setMyInterest(interest);
                          setShowInterestSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-white/[0.06] rounded-xl flex items-center gap-2 transition ${
                          myInterest === interest ? 'bg-white/[0.04]' : ''
                        }`}
                      >
                        <span className="text-gray-300 text-xs font-medium">{interest}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <StatusBadge />
          
          {status === 'connected' && (
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-xl transition ${showChat ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
              title="Toggle Chat Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main Splitscreen Display */}
      <main className="flex-1 flex flex-row relative z-10 w-full h-full overflow-hidden p-4 md:p-6 gap-6">
        
        {/* VIDEO SPLIT CONTAINERS */}
        <div className={`flex-1 flex flex-col sm:flex-row gap-4 md:gap-6 h-full transition-all duration-300 ${status === 'connected' && showChat ? 'md:mr-96' : ''}`}>
          
          {/* LOBBY / IDLE INITIAL VIEW */}
          {status === 'idle' && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center bg-white/[0.02] border border-white/[0.06] p-6 sm:p-10 md:p-14 rounded-[36px] backdrop-blur-md max-w-lg w-full shadow-2xl mx-4">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 sm:mb-8 rounded-full border border-pink-500/20 p-1 flex items-center justify-center bg-gradient-to-br from-pink-500/10 to-violet-500/10 group shadow-[0_0_30px_rgba(255,42,95,0.25)]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 animate-pulse opacity-20"></div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 animate-ping opacity-15" style={{ animationDuration: '3s' }}></div>
                  <div className="w-full h-full rounded-full overflow-hidden border border-white/10 relative">
                    <img 
                      src="/video-chat-ill.png" 
                      className="w-full h-full object-cover object-center transform group-hover:scale-110 transition duration-500" 
                      alt="Video chat chemistry"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 sm:mb-3">Live Video Chemistry</h2>
                <p className="text-gray-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed mb-6 sm:mb-8">
                  Connect live with cute singles instantly. Match with filters and discover your sparks face-to-face.
                </p>
                <button
                  onClick={startVideoChat}
                  disabled={isRequesting}
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 disabled:opacity-50 text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl transition duration-300 shadow-[0_5px_25px_rgba(244,63,94,0.3)] tracking-wider uppercase text-xs sm:text-sm"
                >
                  {isRequesting ? 'Activating Lens...' : 'Match Live Match 🔥'}
                </button>
                {cameraError && (
                  <p className="text-red-400 text-[10px] sm:text-xs mt-4">⚠️ Camera access required: {cameraError}</p>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE CHAT CAMERA FRAMES */}
          {status !== 'idle' && (
            <div className="w-full flex-1 flex flex-col sm:flex-row gap-4 md:gap-6 relative h-[78%] sm:h-[84%] md:h-[88%]">
              
              {/* Partner Cam Frame (Left) */}
              <div className="flex-1 bg-[#0f0c24]/50 border border-white/[0.06] rounded-[28px] overflow-hidden relative shadow-2xl group min-h-[140px] sm:min-h-0">
                {partnerStream ? (
                  <video
                     ref={partnerVideoRef}
                     autoPlay
                     playsInline
                     className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                    <div className="text-center p-4">
                      {/* Pulsing heart ring */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-pink-500/30 animate-ping"></div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                          <span className="text-lg sm:text-xl">❤️</span>
                        </div>
                      </div>
                      <p className="text-white text-sm sm:text-md font-bold">Searching for a Match...</p>
                      <p className="text-gray-400 text-[9px] sm:text-[11px] tracking-widest uppercase mt-1 animate-pulse">igniting the magic</p>
                    </div>
                  </div>
                )}

                {/* Partner Metadata Tag */}
                {partnerStream && (
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 bg-[#0c0b1e]/80 backdrop-blur border border-white/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg">
                    {partnerLocation.flag ? (
                      <img src={partnerLocation.flag} alt="Flag" className="w-4 h-2.5 sm:w-5 sm:h-3 rounded" />
                    ) : (
                      <span className="text-xs sm:text-sm">🌍</span>
                    )}
                    <span className="text-white text-[10px] sm:text-xs font-semibold">{partnerLocation.country || 'Stranger'}</span>
                  </div>
                )}
              </div>

              {/* My Cam Frame (Right) */}
              <div className="flex-1 bg-[#0f0c24]/50 border border-white/[0.06] rounded-[28px] overflow-hidden relative shadow-2xl group min-h-[140px] sm:min-h-0">
                {myStream ? (
                  <video
                    ref={myVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <div className="text-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-400 text-[10px] sm:text-xs">Accessing camera...</p>
                    </div>
                  </div>
                )}

                {/* Self Info Overlay */}
                {myStream && (
                  <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 bg-[#0c0b1e]/85 backdrop-blur border border-white/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg">
                    <span className="text-white text-[10px] sm:text-xs font-semibold">You</span>
                    {myLocation.flag && <img src={myLocation.flag} alt="Flag" className="w-4 h-2.5 sm:w-5 sm:h-3 rounded" />}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Dynamic Glass Control Dock (Bottom Float) */}
        {status !== 'idle' && (
          <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl w-[92%] md:w-full z-30 bg-[#0e0c24]/80 border border-white/[0.08] backdrop-blur-md rounded-[24px] px-3 py-2.5 sm:px-6 sm:py-4 flex items-center justify-between gap-1.5 sm:gap-4 shadow-2xl">
            
            {/* Left Button Group: Disconnect/Stop & Report */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={stopChat}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1.5 sm:gap-2"
                title="Stop Conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Stop</span>
              </button>

              {status === 'connected' && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2.5 sm:p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 transition transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1.5 sm:gap-2"
                  title="Report Abuse / Violation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Report</span>
                </button>
              )}
            </div>


            {/* Middle Controls (Mute, Camera toggle, Switch device) */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={toggleMute}
                className={`p-2.5 sm:p-3.5 rounded-2xl transition transform hover:scale-105 active:scale-95 ${
                  isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] border border-white/[0.08]'
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-2.5 sm:p-3.5 rounded-2xl transition transform hover:scale-105 active:scale-95 ${
                  isCameraOff ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] border border-white/[0.08]'
                }`}
                title={isCameraOff ? "Enable Video" : "Disable Video"}
              >
                {isCameraOff ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1"/>
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                )}
              </button>

              <button
                onClick={switchCamera}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] border border-white/[0.08] transition transform hover:scale-105 active:scale-95"
                title="Switch Camera Lens"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"/>
                  <path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>

            {/* Right Buttons: Spark Sender & Next Partner Match */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {status === 'connected' && (
                <button
                  onClick={sendHeartSpark}
                  className="p-2.5 sm:p-3.5 rounded-2xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 hover:border-pink-500/50 transition transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(236,72,153,0.15)] flex items-center gap-1.5 sm:gap-2"
                  title="Send Chemistry Spark (Heart Burst) ❤️"
                >
                  <span className="text-base sm:text-lg animate-pulse">💖</span>
                  <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Send Spark</span>
                </button>
              )}

              <button
                onClick={nextChat}
                className="p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold transition transform hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(244,63,94,0.35)] flex items-center gap-1.5 sm:gap-2"
                title="Skip / Find Next Spark"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Next Spark</span>
                <span className="text-xs font-bold uppercase tracking-wider sm:hidden">Next</span>
              </button>
            </div>

          </div>
        )}

        {/* CHAT PANEL SIDEBAR (Floating right overlay) */}
        {status === 'connected' && showChat && (
          <div className="fixed top-[70px] sm:top-20 right-4 bottom-[92px] sm:bottom-28 w-[92%] sm:w-80 md:w-96 bg-[#0e0c24]/90 border border-white/[0.08] backdrop-blur-md rounded-3xl shadow-2xl z-40 flex flex-col overflow-hidden transition-all duration-300 text-xs sm:text-sm">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <span className="text-pink-500">💬</span>
                <span className="text-white font-bold text-sm">Direct Sparks</span>
              </div>
              <button 
                onClick={() => setShowChat(false)} 
                className="text-gray-400 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-xs mt-12 px-6">
                  <p>Break the ice!</p>
                  <p className="mt-1 font-light opacity-80">Say hello and see if the conversation sparkles.</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-xs shadow ${
                        msg.sender === 'You'
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-br-none'
                          : msg.isSystem
                          ? 'bg-white/5 border border-white/5 text-gray-400 text-[10px] uppercase font-bold tracking-wider'
                          : 'bg-white/[0.06] border border-white/[0.04] text-white rounded-bl-none'
                      }`}
                    >
                      {!msg.isSystem && msg.sender !== 'You' && (
                        <div className="text-[9px] opacity-60 font-semibold uppercase tracking-wider mb-1">{msg.sender}</div>
                      )}
                      <p className="leading-relaxed break-all">{msg.text || msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              
              {partnerTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/[0.05] px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-white/[0.06] bg-white/[0.01]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Send a matching signal..."
                  className="flex-1 bg-white/[0.04] text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition placeholder-gray-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-4 rounded-xl transition text-xs shadow-[0_4px_10px_rgba(244,63,94,0.25)]"
                >
                  Send
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

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
                  '🔞 Nudity or Inappropriate Feed',
                  '🤬 Harassment, Threats or Bullying',
                  '🤖 Bot, Fake or Static Camera',
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

export default VideoChat;
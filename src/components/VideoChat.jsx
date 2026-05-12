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
        addSystemMessage('Connection established.');
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

    return () => cleanup();
  }, []);

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
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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
      
      // FIXED: Attach stream to video element immediately
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.onloadedmetadata = () => {
          myVideoRef.current.play().catch(e => console.log("Play error:", e));
        };
      }
      
      setStatus('waiting');
      addSystemMessage('Finding a stranger...');
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
      addSystemMessage('Connection error');
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
    addSystemMessage('Finding a new stranger...');
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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      
      {/* LEFT SIDE CONTROLS */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-4">
        {(status === 'connected' || status === 'waiting') && (
          <>
            <button
              onClick={nextChat}
              className="bg-white hover:bg-gray-100 text-black px-8 py-3 rounded-full flex items-center gap-2 transition shadow-lg font-medium text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9"/>
              </svg>
              Next
            </button>

            <button
              onClick={stopChat}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center gap-2 transition shadow-lg font-medium text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="6" y="6" width="12" height="12"/>
              </svg>
              Stop
            </button>
          </>
        )}

        <div className="relative">
          <button
            onClick={() => setShowCountrySelector(!showCountrySelector)}
            className="bg-white hover:bg-gray-100 text-black px-8 py-3 rounded-full flex items-center gap-2 transition shadow-lg font-medium text-lg"
          >
            <span className="text-xl">{getCountryFlag(selectedCountry)}</span>
            Country
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          {showCountrySelector && (
            <div className="absolute left-0 bottom-full mb-2 bg-white rounded-xl shadow-xl w-64 max-h-80 overflow-y-auto z-50">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setSelectedCountry(country.code);
                    setShowCountrySelector(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition ${
                    selectedCountry === country.code ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-gray-800 text-sm">{country.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowInterestSelector(!showInterestSelector)}
            className="bg-white hover:bg-gray-100 text-black px-8 py-3 rounded-full flex items-center gap-2 transition shadow-lg font-medium text-lg"
          >
            <span className="text-xl">😊</span>
            I am
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          {showInterestSelector && (
            <div className="absolute left-0 bottom-full mb-2 bg-white rounded-xl shadow-xl w-64 max-h-80 overflow-y-auto z-50">
              {interests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => {
                    setMyInterest(interest);
                    setShowInterestSelector(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-3 transition ${
                    myInterest === interest ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="text-gray-800 text-sm">{interest}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="fixed top-4 left-4 z-50 bg-black bg-opacity-60 hover:bg-opacity-80 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      {/* Chat Toggle Button */}
      {status === 'connected' && (
        <button
          onClick={() => setShowChat(!showChat)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {/* Status Bar */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-black bg-opacity-60 backdrop-blur-sm px-5 py-2 rounded-full">
        <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${status === 'connected' ? 'bg-green-500' : status === 'waiting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <span className="text-white text-sm font-medium">
          {status === 'idle' && 'Not Connected'}
          {status === 'waiting' && 'Finding stranger...'}
          {status === 'connected' && 'Connected'}
          {status === 'disconnected' && 'Disconnected'}
        </span>
      </div>

      {/* MAIN VIDEO CONTAINER - 50/50 SPLIT */}
      <div className="flex flex-row h-full w-full">
        
        {/* LEFT SIDE - Partner Video (50%) */}
        <div className="w-1/2 relative bg-gray-900 border-r border-gray-700">
          {status === 'idle' ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <path d="m22 10-4 2 4 2Z"/>
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Video Chat</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                  Connect with random strangers anonymously
                </p>
                <button
                  onClick={startVideoChat}
                  disabled={isRequesting}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-lg transition shadow-lg"
                >
                  {isRequesting ? 'Starting Camera...' : 'Start Video Chat'}
                </button>
                {cameraError && (
                  <p className="text-red-400 text-sm mt-4">{cameraError}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <video
                ref={partnerVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Partner Info */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black bg-opacity-60 backdrop-blur-sm px-4 py-2 rounded-full">
                <img src={partnerLocation.flag} alt="Flag" className="w-6 h-4 rounded" />
                <span className="text-white text-sm font-medium">{partnerLocation.country || 'Stranger'}</span>
              </div>

              {/* Waiting Overlay */}
              {!partnerStream && status === 'waiting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-xl font-medium">Waiting for stranger...</p>
                    <p className="text-gray-400 text-sm mt-2">Finding someone to connect with</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT SIDE - My Video (50%) - FIXED: Always render video element */}
        <div className="w-1/2 relative bg-gray-900">
          {/* FIXED: Video element always rendered, not conditional */}
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Show placeholder when no stream */}
          {!myStream && status !== 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          
          {/* Show initial message when idle */}
          {status === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <p className="text-gray-500 text-lg">Your video will appear here</p>
                <p className="text-gray-600 text-sm mt-2">Click "Start Video Chat" to begin</p>
              </div>
            </div>
          )}
          
          {/* My Info - Only show when stream exists */}
          {myStream && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">You</span>
                <img src={myLocation.flag} alt="Flag" className="w-6 h-4 rounded" />
              </div>
            </div>
          )}

          {/* Video Controls - Only show when connected */}
          {myStream && status === 'connected' && (
            <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-5 z-10">
              <button
                onClick={toggleMute}
                className={`p-3.5 rounded-full transition transform hover:scale-110 ${
                  isMuted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="3" y1="3" x2="21" y2="21"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                  </svg>
                )}
              </button>
              
              <button
                onClick={toggleCamera}
                className={`p-3.5 rounded-full transition transform hover:scale-110 ${
                  isCameraOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isCameraOff ? "Turn on camera" : "Turn off camera"}
              >
                {isCameraOff ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <path d="m22 10-4 2 4 2Z"/>
                    <line x1="3" y1="3" x2="21" y2="21"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <path d="m22 10-4 2 4 2Z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={switchCamera}
                className="p-3.5 rounded-full bg-gray-700 hover:bg-gray-600 transition transform hover:scale-110"
                title="Switch Camera"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M23 5v4h-4M1 19v-4h4"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel - Floating on Right */}
      {status === 'connected' && showChat && (
        <div className="fixed top-20 right-4 bottom-20 w-96 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl z-50 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-white font-medium">Chat with Stranger</span>
            </div>
            <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                <p>Say hello to start chatting!</p>
                <p className="text-xs mt-2">Your conversation is anonymous</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                      msg.sender === 'You'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : msg.isSystem
                        ? 'bg-gray-700 text-gray-300 text-xs'
                        : 'bg-gray-700 text-white rounded-bl-sm'
                    }`}
                  >
                    {!msg.isSystem && msg.sender !== 'You' && (
                      <div className="text-xs opacity-75 mb-1">{msg.sender}</div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {partnerTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 px-4 py-2 rounded-2xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Write a message..."
                className="flex-1 bg-gray-800 text-white text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full transition text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>

          {/* Report abuse */}
          <div className="px-4 pb-4 text-center">
            <button className="text-gray-500 text-xs hover:text-red-400 transition">
              Report abuse
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
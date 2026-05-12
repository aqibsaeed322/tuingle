import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const TextChat = ({ onBack }) => {
  const [status, setStatus] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  let typingTimeoutRef = useRef(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    socketRef.current = io(socketUrl);
    
    socketRef.current.on('chat:start', () => {
      setStatus('connected');
      addSystemMessage('Connected to a stranger');
    });
    
    socketRef.current.on('message', (data) => {
      setMessages(prev => [...prev, data]);
    });
    
    socketRef.current.on('typing', (isTyping) => {
      setPartnerTyping(isTyping);
    });
    
    socketRef.current.on('partner:disconnected', () => {
      setStatus('disconnected');
      addSystemMessage('Partner disconnected');
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
    addSystemMessage('Finding a stranger...');
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
    addSystemMessage('Finding new partner...');
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
      idle: { text: 'Not Connected', color: 'bg-gray-600' },
      waiting: { text: 'Finding Partner...', color: 'bg-yellow-600 animate-pulse' },
      connected: { text: 'Connected', color: 'bg-green-600' },
      disconnected: { text: 'Disconnected', color: 'bg-red-600' }
    };
    
    const current = config[status];
    return (
      <span className={`${current.color} text-white px-3 py-1 rounded-full text-sm`}>
        {current.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-gray-800 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <button onClick={onBack} className="text-white hover:text-gray-300">
            ← Back
          </button>
          <StatusBadge />
          {status === 'connected' && (
            <button
              onClick={nextChat}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
          <div className="h-[500px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && status === 'idle' && (
              <div className="text-center text-gray-500 mt-48">
                <p className="text-xl mb-4">📝 Anonymous Text Chat</p>
                <button
                  onClick={startChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition"
                >
                  Start Text Chat
                </button>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                {msg.sender === 'system' ? (
                  <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-full text-sm">
                    {msg.message}
                  </div>
                ) : (
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender === 'me' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-100'
                  }`}>
                    {msg.message}
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {partnerTyping && status === 'connected' && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {status === 'connected' && (
            <div className="border-t border-gray-800 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {status === 'connected' && (
          <div className="mt-4 text-center">
            <button className="text-red-400 hover:text-red-500 text-sm">
              🚩 Report User
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextChat;
import React, { useState } from 'react';

const ModeSelector = ({ onSelectMode }) => {
  const [showPolicy, setShowPolicy] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState('terms');

  return (
    <div className="relative min-h-screen bg-[#080711] overflow-hidden flex items-center justify-center p-6">

      {/* Background Decorative Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-pink-600/10 to-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-rose-600/10 to-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative max-w-4xl w-full z-10">

        {/* Top Header Section */}
        <div className="text-center mb-10">

          {/* Active Online Counter Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-2xl animate-pulse mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff2a5f] shadow-[0_0_12px_#ff2a5f]"></span>
            <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">🔥 1,428 Singles Connected</span>
          </div>

          {/* Logo and Name Side-by-Side Header */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
            <div className="relative w-20 h-20 rounded-full border border-pink-500/20 p-1 flex items-center justify-center bg-gradient-to-br from-pink-500/10 to-violet-500/10 shadow-[0_0_30px_rgba(255,42,95,0.35)] hover:scale-110 transition-all duration-300">
              <img
                src="/twinpulse-logo.png"
                className="w-full h-full object-cover rounded-full"
                alt="TwinPulse Logo"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 tracking-tight drop-shadow-[0_2px_15px_rgba(255,42,95,0.15)] font-sans select-none">
              TwinPulse <span className="text-pink-500 drop-shadow-[0_0_8px_#ff2a5f] inline-block animate-pulse">❤️</span>
            </h1>
          </div>

          <p className="text-gray-400 text-lg md:text-xl font-light max-w-lg mx-auto leading-relaxed">
            Connect with unique souls, spark deep conversations, and find your match under the veil of anonymity.
          </p>
        </div>

        {/* Option Grid */}
        <div className="grid md:grid-cols-2 gap-8 px-4 md:px-0">

          {/* Card 1: Text Chat */}
          <div
            onClick={() => onSelectMode('text')}
            className="group relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-violet-500/30 rounded-[32px] p-6 cursor-pointer transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(124,58,237,0.15)] flex flex-col justify-between min-h-[500px]"
          >
            {/* Glowing border hover overlay */}
            <div className="absolute -inset-px bg-gradient-to-r from-violet-500 to-indigo-600 rounded-[32px] opacity-0 group-hover:opacity-10 transition duration-500 blur-sm -z-10"></div>

            <div>
              {/* Premium 3D Generated Illustration Header */}
              <div className="relative h-44 rounded-2xl overflow-hidden mb-6 bg-[#0f0c24]/80 border border-white/[0.05]">
                <img
                  src="/text-chat-ill.png"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  alt="Text chat matchmaking"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080711] via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-violet-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow border border-white/10">
                  Incognito Text
                </div>
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-2 group-hover:text-violet-400 transition duration-300">
                Text Chat
              </h2>

              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                Whisper your thoughts, ignite a flame, and let the magic of pure text create deep chemistry.
              </p>
            </div>

            <div className="space-y-3.5 my-4">
              <div className="flex items-center gap-3 text-gray-300 text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <span>Anonymous Messaging Spark</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300 text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <span>100% Private, Safe & Incognito</span>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-2xl transition duration-300 shadow-[0_4px_25px_rgba(124,58,237,0.25)] tracking-wide text-sm uppercase">
              Start Text Chat →
            </button>
          </div>

          {/* Card 2: Video Chat */}
          <div
            onClick={() => onSelectMode('video')}
            className="group relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-pink-500/30 rounded-[32px] p-6 cursor-pointer transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(255,42,95,0.15)] flex flex-col justify-between min-h-[500px]"
          >
            {/* Glowing border hover overlay */}
            <div className="absolute -inset-px bg-gradient-to-r from-pink-500 to-rose-600 rounded-[32px] opacity-0 group-hover:opacity-10 transition duration-500 blur-sm -z-10"></div>

            <div>
              {/* Premium 3D Generated Illustration Header */}
              <div className="relative h-44 rounded-2xl overflow-hidden mb-6 bg-[#0f0c24]/80 border border-white/[0.05]">
                <img
                  src="/video-chat-ill.png"
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                  alt="Video chat matchmaking"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080711] via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-pink-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow border border-white/10">
                  Live Video Match
                </div>
              </div>

              <h2 className="text-3xl font-extrabold text-white mb-2 group-hover:text-pink-400 transition duration-300">
                Video Chat
              </h2>

              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                Meet eye-to-eye, see their genuine smiles, and let real, live emotions spark face-to-face.
              </p>
            </div>

            <div className="space-y-3.5 my-4">
              <div className="flex items-center gap-3 text-gray-300 text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <span>Real-time Face-to-Face Sparks</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300 text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <span>Ultra-low Latency HD Stream</span>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold py-3.5 rounded-2xl transition duration-300 shadow-[0_4px_25px_rgba(255,42,95,0.25)] tracking-wide text-sm uppercase">
              Start Video Chat →
            </button>
          </div>

        </div>

        {/* Footer & Privacy safety trigger */}
        <div className="mt-14 text-center text-xs text-gray-500 font-light flex flex-col items-center justify-center gap-2">
          <span>⚠️ Be respectful. Romance blooms where respect rules. 18+ only.</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPolicy(true);
            }}
            className="text-pink-500 hover:text-pink-400 font-bold hover:underline transition uppercase tracking-wider text-[10px] mt-2 bg-pink-500/5 px-4 py-1.5 rounded-full border border-pink-500/10 backdrop-blur"
          >
            🛡️ Privacy Policy & Safety Guidelines
          </button>
        </div>

      </div>

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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
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
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs md:text-sm font-semibold tracking-wide transition duration-300 whitespace-nowrap ${activePolicyTab === tab.id
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

export default ModeSelector;
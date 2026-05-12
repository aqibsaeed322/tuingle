import React from 'react';

const ModeSelector = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Anonymous Random Chat
          </h1>
          <p className="text-gray-400 text-lg">
            Connect with strangers anonymously. Choose your mode.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Text Chat Card */}
          <div 
            onClick={() => onSelectMode('text')}
            className="bg-gray-800 rounded-2xl p-8 cursor-pointer transform transition hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Text Chat
            </h2>
            <p className="text-gray-400 text-center mb-4">
              Classic anonymous text messaging
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <span>🔒</span> Fully anonymous
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span>⚡</span> Real-time messaging
              </div>
            </div>
            <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
              Start Text Chat →
            </button>
          </div>

          {/* Video Chat Card */}
          <div 
            onClick={() => onSelectMode('video')}
            className="bg-gray-800 rounded-2xl p-8 cursor-pointer transform transition hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-green-600 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"/>
                  <path d="m22 10-4 2 4 2Z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Video Chat
            </h2>
            <p className="text-gray-400 text-center mb-4">
              Face-to-face anonymous video calls
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <span>🔒</span> Anonymous video
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span>⚡</span> HD quality streaming
              </div>
            </div>
            <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition">
              Start Video Chat →
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>⚠️ Please follow community guidelines. Report inappropriate behavior.</p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;
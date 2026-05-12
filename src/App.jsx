
import React, { useState } from 'react';
import ModeSelector from './components/ModeSelector';
import TextChat from './components/TextChat';
import VideoChat from './components/VideoChat';

function App() {
  const [mode, setMode] = useState(null);

  if (!mode) {
    return <ModeSelector onSelectMode={setMode} />;
  }

  if (mode === 'text') {
    return <TextChat onBack={() => setMode(null)} />;
  }

  return <VideoChat onBack={() => setMode(null)} />;
}

export default App;
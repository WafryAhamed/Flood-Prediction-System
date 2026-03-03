import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
export function VoiceNarration() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);
  const toggleSpeech = () => {
    if (!isSupported) return;
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const text = document.body.innerText;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };
  if (!isSupported) return null;
  return <button onClick={toggleSpeech} className={`
        fixed right-6 bottom-56 z-[9999] pointer-events-auto
        w-14 h-14 border-4 border-black flex items-center justify-center rounded-full
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 transition-transform
        ${isPlaying ? 'bg-[#FFCC00] text-black' : 'bg-white text-black'}
      `} aria-label={isPlaying ? 'Stop Narration' : 'Read Page Aloud'}>
      {isPlaying ? <VolumeX size={24} strokeWidth={3} /> : <Volume2 size={24} strokeWidth={3} />}
    </button>;
}
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
        fixed bottom-20 left-4 md:bottom-8 md:left-8 z-30
        w-14 h-14 border-4 border-black flex items-center justify-center
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all
        ${isPlaying ? 'bg-[#FFCC00] text-black' : 'bg-white text-black'}
      `} aria-label={isPlaying ? 'Stop Narration' : 'Read Page Aloud'}>
      {isPlaying ? <VolumeX size={24} strokeWidth={3} /> : <Volume2 size={24} strokeWidth={3} />}
    </button>;
}
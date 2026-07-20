'use client';
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  onResult: (transcript: string) => void;
  disabled?: boolean;
}

export default function VoiceButton({ onResult, disabled }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  const toggle = useCallback(() => {
    if (disabled) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice not supported in this browser.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      setError(e.error === 'not-allowed' ? 'Mic access denied.' : 'Voice error: ' + e.error);
      setTimeout(() => setError(''), 3000);
    };
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);

      // Also speak confirmation
      if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance('Got it. Searching for: ' + transcript);
        utt.rate = 1; utt.pitch = 1.1; utt.volume = 0.6;
        window.speechSynthesis.speak(utt);
      }
    };

    recognition.start();
  }, [isListening, disabled, onResult]);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        disabled={disabled}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all relative"
        style={{
          background: isListening
            ? 'linear-gradient(135deg, #e91e63, #c2185b)'
            : 'rgba(255,255,255,0.06)',
          boxShadow: isListening ? '0 0 20px rgba(233,30,99,0.5)' : 'none',
          opacity: disabled ? 0.4 : 1,
        }}
        title={isListening ? 'Stop listening' : 'Voice input'}
      >
        {isListening ? <MicOff size={15} className="text-white" /> : <Mic size={15} className="text-gray-300" />}

        {/* Pulse rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              {[1, 2].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-xl border border-pink-500"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8 + i * 0.4, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: -44 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-900/90 text-red-200 text-xs px-3 py-1.5 rounded-lg border border-red-700/50"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

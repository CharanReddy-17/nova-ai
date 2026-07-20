'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Augment window type for webkit
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim('');
    setError('');
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setError('');

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      if (finalText) {
        onTranscript(finalText.trim());
        setInterim('');
      } else {
        setInterim(interimText);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') {
        setError('No speech detected. Try again.');
      } else if (e.error === 'not-allowed') {
        setError('Microphone access denied.');
      } else {
        setError('Voice error: ' + e.error);
      }
      setListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognition.start();
  }, [onTranscript]);

  if (!supported) return null;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* Mic button */}
      <motion.button
        onClick={listening ? stop : start}
        disabled={disabled}
        whileTap={{ scale: 0.9 }}
        title={listening ? 'Stop recording' : 'Voice input'}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `1.5px solid ${listening ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
          background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.2s',
        }}
      >
        {/* Pulse rings when active */}
        {listening && (
          <>
            {[1, 2].map(i => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '1px solid rgba(239,68,68,0.3)',
                }}
                animate={{ scale: [1, 1.8 + i * 0.4], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </>
        )}
        {listening
          ? <MicOff size={15} style={{ color: '#ef4444', position: 'relative', zIndex: 1 }} />
          : <Mic size={15} style={{ color: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 1 }} />
        }
      </motion.button>

      {/* Live transcript bubble */}
      <AnimatePresence>
        {(listening || interim) && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            style={{
              position: 'absolute',
              right: 'calc(100% + 8px)',
              bottom: 0,
              background: '#18181b',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
              padding: '8px 12px',
              minWidth: 160,
              maxWidth: 280,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Animated dots */}
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444' }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, color: interim ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontStyle: interim ? 'normal' : 'italic' }}>
                {interim || 'Listening…'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error tooltip */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              right: 0,
              background: '#2a1515',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11,
              color: '#ef4444',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {error}
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <X size={11} style={{ color: '#ef4444' }} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

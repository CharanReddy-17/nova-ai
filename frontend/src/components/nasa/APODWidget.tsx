'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Calendar, X } from 'lucide-react';
import { nasaService } from '@/services/nasaService';
import Image from 'next/image';

interface APOD {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  date: string;
  media_type: 'image' | 'video';
  copyright?: string;
}

export default function APODWidget() {
  const [apod, setApod] = useState<APOD | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    nasaService.getAPOD()
      .then(setApod)
      .catch(() => setError('NASA data unavailable. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="w-16 h-16 rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
        <div className="h-2 bg-white/5 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );

  if (error) return (
    <div className="px-5 py-4 text-sm text-red-400 flex items-center gap-2">
      ⚠️ {error}
    </div>
  );

  if (!apod) return null;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {apod.media_type === 'image' ? (
          <div
            className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
            onClick={() => setExpanded(true)}
            style={{ border: '1px solid rgba(79,195,247,0.2)' }}
          >
            <img src={apod.url} alt={apod.title} className="w-full h-full object-cover hover:scale-110 transition-transform" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl bg-white/5">🎬</div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-cosmic-blue/20 text-cosmic-blue px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">NASA APOD</span>
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <Calendar size={9} /> {apod.date}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight truncate">{apod.title}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{apod.explanation}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setExpanded(true)}
              className="text-[11px] text-cosmic-blue hover:underline"
            >
              Read more
            </button>
            {apod.hdurl && (
              <a href={apod.hdurl} target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1">
                <ExternalLink size={9} /> HD Image
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Expanded modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-2xl w-full rounded-2xl overflow-hidden"
              style={{ background: 'rgba(5,5,20,0.97)', border: '1px solid rgba(79,195,247,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              {apod.media_type === 'image' && (
                <img src={apod.hdurl || apod.url} alt={apod.title} className="w-full max-h-80 object-cover" />
              )}
              <div className="p-6">
                <button onClick={() => setExpanded(false)} className="absolute top-4 right-4 bg-black/50 rounded-full p-1.5 text-white hover:bg-black/80 transition">
                  <X size={16} />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-cosmic-blue/20 text-cosmic-blue px-2 py-0.5 rounded-full">NASA APOD · {apod.date}</span>
                  {apod.copyright && <span className="text-xs text-gray-500">© {apod.copyright}</span>}
                </div>
                <h2 className="text-xl font-bold text-white mb-3">{apod.title}</h2>
                <p className="text-sm text-gray-300 leading-relaxed">{apod.explanation}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, RefreshCw, X, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { uploadService } from '@/services/uploadService';

interface UploadedImage { _id: string; url: string; analysis: string; filename: string; createdAt: string; }

export default function LibraryPage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UploadedImage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    uploadService.getUserImages()
      .then(setImages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteImage = async (id: string) => {
    await uploadService.deleteImage(id);
    setImages(prev => prev.filter(i => i._id !== id));
    if (selected?._id === id) setSelected(null);
  };

  const reanalyze = async (img: UploadedImage) => {
    setAnalyzing(true);
    try {
      const analysis = await uploadService.reanalyzeImage(img._id);
      setImages(prev => prev.map(i => i._id === img._id ? { ...i, analysis } : i));
      setSelected(prev => prev?._id === img._id ? { ...prev, analysis } : prev);
    } catch { /* silent */ }
    finally { setAnalyzing(false); }
  };

  return (
    <div className="min-h-screen bg-space-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 rounded-xl glass hover:bg-white/10 transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Image Library</h1>
            <p className="text-sm text-gray-400">{images.length} astronomy image{images.length !== 1 ? 's' : ''} uploaded</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-semibold text-white mb-2">No images yet</h2>
            <p className="text-gray-400 text-sm mb-6">Upload astronomy photos to get AI analysis</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 mx-auto"
              style={{ background: 'linear-gradient(135deg, #4fc3f7, #7b1fa2)' }}>
              <Upload size={16} /> Upload Images
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, i) => (
              <motion.div
                key={img._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="group relative aspect-video rounded-2xl overflow-hidden cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                onClick={() => setSelected(img)}
              >
                <img src={img.url} alt={img.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-xs text-white truncate">{img.filename}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteImage(img._id); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-900/70 rounded-lg text-red-200 opacity-0 group-hover:opacity-100 transition hover:bg-red-800"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="max-w-2xl w-full rounded-3xl overflow-hidden"
              style={{ background: 'rgba(5,5,20,0.97)', border: '1px solid rgba(79,195,247,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="relative">
                <img src={selected.url} alt={selected.filename} className="w-full max-h-72 object-cover" />
                <button onClick={() => setSelected(null)} className="absolute top-3 right-3 bg-black/60 rounded-full p-2 hover:bg-black/80 transition">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-white mb-1">{selected.filename}</h3>
                <p className="text-xs text-gray-500 mb-4">{new Date(selected.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-cosmic-blue uppercase tracking-wide">🔭 AI Analysis</p>
                    <button onClick={() => reanalyze(selected)} disabled={analyzing}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition">
                      <RefreshCw size={11} className={analyzing ? 'animate-spin' : ''} />
                      {analyzing ? 'Analyzing...' : 'Re-analyze'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{selected.analysis}</p>
                </div>
                <button
                  onClick={() => deleteImage(selected._id)}
                  className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition mt-2"
                >
                  <Trash2 size={14} /> Delete image
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

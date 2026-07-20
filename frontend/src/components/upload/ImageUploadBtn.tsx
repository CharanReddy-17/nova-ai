'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { uploadService } from '@/services/uploadService';

export default function ImageUploadBtn() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; analysis: string } | null>(null);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const MAX_SIZE = 10 * 1024 * 1024;
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      setError('Unsupported format. Use JPG, PNG, or WebP.'); setTimeout(() => setError(''), 4000); return;
    }
    if (file.size > MAX_SIZE) {
      setError('Maximum file size exceeded (10MB).'); setTimeout(() => setError(''), 4000); return;
    }

    setUploading(true);
    setError('');
    try {
      const image = await uploadService.uploadImage(file);
      setPreview({ url: image.url, analysis: image.analysis });
    } catch (err: any) {
      setError(err?.error || 'Image upload failed.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ background: 'rgba(255,255,255,0.06)', opacity: uploading ? 0.6 : 1 }}
        title="Upload astronomy image"
      >
        {uploading ? <Loader2 size={15} className="text-cosmic-blue animate-spin" /> : <ImagePlus size={15} className="text-gray-300" />}
      </motion.button>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: -320 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-0 z-50 w-72 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(5,5,20,0.95)', border: '1px solid rgba(79,195,247,0.3)', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
          >
            <div className="relative">
              <img src={preview.url} alt="uploaded" className="w-full h-40 object-cover" />
              <button onClick={() => setPreview(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/80 transition">
                <X size={14} />
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-cosmic-blue mb-1">🔭 AI Analysis</p>
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-5">{preview.analysis}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: -44 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-900/90 text-red-200 text-xs px-3 py-1.5 rounded-lg border border-red-700/50"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

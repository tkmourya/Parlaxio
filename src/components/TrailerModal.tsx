import { X } from 'lucide-react';
import { useEffect } from 'react';

interface TrailerModalProps {
  trailerKey: string | null;
  onClose: () => void;
}

export function TrailerModal({ trailerKey, onClose }: TrailerModalProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (trailerKey) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [trailerKey]);

  if (!trailerKey) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X size={24} />
      </button>
      <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&showinfo=0&modestbranding=1&controls=1`}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title="Trailer"
        />
      </div>
    </div>
  );
}

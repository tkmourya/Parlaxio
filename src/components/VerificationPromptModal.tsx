import { X, MailCheck, Send } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

export interface VerificationPromptModalProps {
  onClose: () => void;
}

export function VerificationPromptModal({ onClose }: VerificationPromptModalProps) {
  const { sendVerificationEmail } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await sendVerificationEmail();
      setSent(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Top Graphic Area */}
        <div className="relative h-40 bg-gradient-to-br from-zinc-500/30 via-zinc-900 to-zinc-950 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <MailCheck className="text-zinc-200" size={28} />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Verify your Email</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Please verify your email address to unlock playback and get your VIP Verified badge.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSend}
              disabled={isSending || sent}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-all ${
                sent 
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                  : 'bg-zinc-200 hover:bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]'
              }`}
            >
              <Send size={18} />
              {isSending ? 'Sending Link...' : sent ? 'Verification Link Sent!' : 'Send Verification Link'}
            </button>
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              I'll do it later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

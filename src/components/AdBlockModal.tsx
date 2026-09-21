import { ShieldAlert, X } from 'lucide-react';

interface AdBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdBlockModal({ isOpen, onClose }: AdBlockModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gradient-to-br from-zinc-900 to-black backdrop-blur-2xl rounded-3xl p-6 shadow-[0_10px_40px_rgba(255,255,255,0.1)] border border-white/10 space-y-5 text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-white to-zinc-400 border border-white/20 text-black flex items-center justify-center shadow-inner">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Ad-Free Experience</h3>
              <p className="text-xs text-zinc-400">How to block video pop-up ads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Since we use 3rd-party servers to provide free movies, you might see pop-up ads when clicking the video. Use these methods to block them completely:
          </p>
          
          <div className="space-y-3">
            <div className="p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs">1</span>
                Change Phone DNS (Recommended)
              </h4>
              <p className="text-xs text-zinc-400 ml-7">
                Go to Phone Settings &gt; Network &gt; Private DNS. Set it to <strong className="text-white select-all">dns.adguard.com</strong>
              </p>
            </div>

            <div className="p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs">2</span>
                Use Brave Browser
              </h4>
              <p className="text-xs text-zinc-400 ml-7">
                Open this app in the <strong className="text-white">Brave Browser</strong> app. It blocks all video ads by default.
              </p>
            </div>

            <div className="p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5">
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-xs">3</span>
                AdBlocker Extension
              </h4>
              <p className="text-xs text-zinc-400 ml-7">
                If on PC, install any <strong className="text-white">AdBlocker extension</strong> in your browser (Chrome/Edge/Firefox).
              </p>
            </div>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-white to-zinc-300 text-black font-bold text-sm hover:from-zinc-200 hover:to-zinc-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer mt-2"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

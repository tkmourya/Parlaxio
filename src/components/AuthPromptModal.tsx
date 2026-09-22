import { X, Lock, Play, UserCircle2 } from 'lucide-react';

export interface AuthPromptModalProps {
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export function AuthPromptModal({ onClose, onLogin, onRegister }: AuthPromptModalProps) {
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
        <div className="relative h-48 bg-gradient-to-br from-red-900/40 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-600 rounded-full blur-[64px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-red-800 rounded-full blur-[64px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative z-10 w-20 h-20 rounded-full bg-zinc-900/80 border border-red-500/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
            <Lock className="text-red-500" size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Login to Continue</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Create an account or log in to watch full movies, TV shows, Live TV, and play music. It only takes a minute!
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
            >
              <UserCircle2 size={20} />
              Login to Account
            </button>
            <button
              onClick={onRegister}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl border border-white/10 transition-colors"
            >
              Create New Account
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

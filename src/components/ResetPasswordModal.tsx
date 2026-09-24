import { useState } from 'react';
import { X, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export interface ResetPasswordModalProps {
  userId: string;
  secret: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({ userId, secret, onClose, onSuccess }: ResetPasswordModalProps) {
  const { completeResetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    try {
      await completeResetPassword(userId, secret, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" />
      
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>

        <div className="relative h-40 bg-gradient-to-br from-green-900/40 via-zinc-900 to-zinc-950 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-green-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <KeyRound className="text-green-500" size={28} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">New Password</h2>
          <p className="text-zinc-400 text-sm mb-6 text-center">Create a new secure password for your account.</p>

          <div className="relative mb-6">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="password" 
              placeholder="New Password (min 8 chars)" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-green-500/50 transition-colors"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-red-400 text-xs mb-4 text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            {isSubmitting ? 'Saving...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

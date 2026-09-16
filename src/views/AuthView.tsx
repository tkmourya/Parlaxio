import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthView({ onComplete, initialMode = 'login' }: { onComplete: () => void, initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      if (mode === 'forgot') {
        // Simple mock for forgot password for now, or connect to Appwrite later
        setMessage(`Password reset link sent to ${email}`);
        setLoading(false);
        setTimeout(() => {
          setMode('login');
          setMessage('');
        }, 2000);
        return;
      }

      if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('Name is required for registration.');
        }
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-0 sm:px-4 relative pt-0 sm:pt-24 pb-0 sm:pb-20">
      
      {/* Frosted Ambient Smokey Grey Atmosphere */}
      <div className="fixed top-1/4 left-1/3 -z-10 w-[28rem] h-[28rem] bg-zinc-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 -z-10 w-[28rem] h-[28rem] bg-zinc-800/25 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[32rem] h-[32rem] bg-zinc-700/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Full page on mobile, Frosted Glass Card on desktop */}
      <div className="w-full min-h-screen sm:min-h-0 sm:max-w-md bg-zinc-950 sm:bg-black/25 backdrop-blur-2xl border-0 sm:border sm:border-white/10 p-6 sm:p-9 rounded-none sm:rounded-3xl shadow-none sm:shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10 flex flex-col justify-center animate-in fade-in duration-300">
        
        {/* Back Button */}
        <button 
          onClick={onComplete}
          className="absolute top-6 left-6 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/10"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Brand Logo in Designer Font */}
        <div className="text-center mb-7 pt-2">
          <span className="font-brand-stylish font-black text-3xl tracking-[0.16em] uppercase bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent block drop-shadow-md">
            Parlaxio
          </span>
          <p className="text-xs text-zinc-400 mt-2">
            {mode === 'login' && 'Sign in to sync your library across devices'}
            {mode === 'register' && 'Create your free account for personalized streaming'}
            {mode === 'forgot' && 'Enter your email to recover your account'}
          </p>
        </div>

        {/* Mode Selector Tabs (Frosted Navbar Pill Style) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-black/30 border border-white/10 rounded-2xl mb-6 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'login' 
                  ? 'bg-white/20 text-white shadow-inner border border-white/15' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                mode === 'register' 
                  ? 'bg-white/20 text-white shadow-inner border border-white/15' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center font-medium backdrop-blur-md">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Alex Walker" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" 
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <input 
                required 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" 
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')} 
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
                <input 
                  required 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-2.5 rounded-2xl transition-all active:scale-[0.99] shadow-lg text-sm mt-4 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            ) : mode === 'register' ? (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>

        {mode === 'forgot' ? (
          <div className="mt-5 text-center">
            <button 
              onClick={() => setMode('login')} 
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </div>
        ) : (
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button 
              onClick={onComplete} 
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Continue as Guest →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

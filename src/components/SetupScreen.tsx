import { Film, AlertCircle } from 'lucide-react';

export function SetupScreen() {
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <Film size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to CineStream</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          To get started, you need to connect your free TMDB account. This allows the app to fetch high-quality movie posters, titles, and metadata.
        </p>
        
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-left mb-6 flex gap-3 items-start">
          <AlertCircle className="text-white/70 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-white/80">
            <span className="font-semibold text-white block mb-1">Action Required</span>
            Please add your <code className="bg-black/30 px-1 py-0.5 rounded text-white">VITE_TMDB_API_KEY</code> in the AI Studio Secrets panel or your <code className="bg-black/30 px-1 py-0.5 rounded text-white">.env</code> file.
          </div>
        </div>

        <a 
          href="https://www.themoviedb.org/settings/api" 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center justify-center w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium py-3 px-6 rounded-full transition-colors backdrop-blur-md"
        >
          Get Free TMDB Key
        </a>
      </div>
    </div>
  );
}

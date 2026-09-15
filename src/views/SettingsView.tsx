import { useState, useEffect, FormEvent } from 'react';
import { 
  Shield, Bookmark, Play, ChevronRight, Check, 
  Trash2, Film, Zap, HardDrive, Volume2, Globe, 
  ArrowLeft, LogOut, CheckCircle2, ChevronDown
} from 'lucide-react';
import { WatchlistView } from './WatchlistView';
import { useAuth } from '../lib/AuthContext';
import { getWatchlist } from '../lib/storage';

interface SettingsViewProps {
  onPlay: (id: number, type: 'movie' | 'tv') => void;
}

export function SettingsView({ onPlay }: SettingsViewProps) {
  // Navigation: null = settings list, 'watchlist' = opened watchlist
  const [subView, setSubView] = useState<'watchlist' | null>(null);

  // Settings State
  const [autoplay, setAutoplay] = useState(true);
  const [skipIntro, setSkipIntro] = useState(true);
  const [hdrEnabled, setHdrEnabled] = useState(true);
  const [hardwareAccel, setHardwareAccel] = useState(true);
  
  // Selectable options
  const [videoQuality, setVideoQuality] = useState('4K (2160p)');
  const [streamingServer, setStreamingServer] = useState('Server 1 (Fast)');
  const [audioFormat, setAudioFormat] = useState('Dolby Atmos');
  const [subSize, setSubSize] = useState('Medium');

  // Expanded accordion sections (clean vertical inline expands)
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Cache state
  const [cacheSize, setCacheSize] = useState('24.6 MB');
  const [cacheCleared, setCacheCleared] = useState(false);

  // Auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');

  // Watchlist count
  const [watchlistCount, setWatchlistCount] = useState(0);

  const { user, login, logout } = useAuth();

  useEffect(() => {
    setWatchlistCount(getWatchlist().length);
    const handleUpdate = () => setWatchlistCount(getWatchlist().length);
    window.addEventListener('watchlist-updated', handleUpdate);
    return () => window.removeEventListener('watchlist-updated', handleUpdate);
  }, []);

  const handleClearCache = () => {
    localStorage.removeItem('cine_watch_history');
    setCacheSize('0.0 KB');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputEmail.trim()) return;
    login(inputEmail.trim(), inputName.trim() || inputEmail.split('@')[0]);
    setIsAuthModalOpen(false);
    setInputName('');
    setInputEmail('');
  };

  const toggleExpand = (rowName: string) => {
    setExpandedRow(expandedRow === rowName ? null : rowName);
  };

  // If user tapped "My Watchlist", render Watchlist in list layout with clean back button
  if (subView === 'watchlist') {
    return (
      <div className="px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-36 min-h-screen text-white animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setSubView(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Settings</span>
          </button>
          <span className="text-xs font-semibold text-zinc-400">{watchlistCount} Titles</span>
        </div>

        <WatchlistView onPlay={onPlay} hideHeader={true} layout="list" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-36 min-h-screen text-white animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
      
      {/* Minimal Header without subtext */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
      </div>

      <div className="space-y-6">

        {/* 1. Profile / Account Row */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 overflow-hidden">
              <div className="w-11 h-11 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-200 shrink-0">
                {user ? user.avatarInitials : 'G'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {user ? user.name : 'Guest User'}
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                    {user ? 'VIP' : 'Free'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate">
                  {user ? user.email : 'Sign in to sync your watchlist'}
                </p>
              </div>
            </div>

            {user ? (
              <button 
                onClick={logout}
                className="text-xs text-zinc-400 hover:text-white font-medium px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs text-white font-medium px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition shrink-0 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* 2. Library Vertical List */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2 block">
            Library
          </span>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <button
              onClick={() => setSubView('watchlist')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <Bookmark size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">My Watchlist</span>
                  <span className="text-[11px] text-zinc-400">Movies & shows saved for later</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {watchlistCount}
                </span>
                <ChevronRight size={16} className="text-zinc-500" />
              </div>
            </button>
          </div>
        </div>

        {/* 3. Video & Streaming Vertical List */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2 block">
            Video & Streaming
          </span>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
            
            {/* Resolution Row */}
            <div>
              <button 
                onClick={() => toggleExpand('resolution')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                    <Film size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">Default Quality</span>
                    <span className="text-[11px] text-zinc-400">Playback video resolution</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span className="font-semibold">{videoQuality}</span>
                  {expandedRow === 'resolution' ? <ChevronDown size={15} className="text-zinc-400" /> : <ChevronRight size={15} className="text-zinc-500" />}
                </div>
              </button>

              {/* Vertical Resolution Options Accordion */}
              {expandedRow === 'resolution' && (
                <div className="px-4 py-2 bg-black/40 border-t border-white/5 space-y-1">
                  {[
                    { val: 'Auto (Adaptive)', desc: 'Adjusts to network speed' },
                    { val: '1080p (Full HD)', desc: 'Fast, sharp 1080p stream' },
                    { val: '4K (2160p)', desc: 'Ultra HD high-fidelity bitrate' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        setVideoQuality(item.val);
                        setExpandedRow(null);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
                    >
                      <div>
                        <span className={`text-xs font-semibold block ${videoQuality === item.val ? 'text-white' : 'text-zinc-300'}`}>
                          {item.val}
                        </span>
                        <span className="text-[10px] text-zinc-500">{item.desc}</span>
                      </div>
                      {videoQuality === item.val && <Check size={14} className="text-zinc-200" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Server Row */}
            <div>
              <button 
                onClick={() => toggleExpand('server')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">Streaming Server</span>
                    <span className="text-[11px] text-zinc-400">Content delivery provider</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span className="font-semibold">{streamingServer}</span>
                  {expandedRow === 'server' ? <ChevronDown size={15} className="text-zinc-400" /> : <ChevronRight size={15} className="text-zinc-500" />}
                </div>
              </button>

              {/* Vertical Server Options Accordion */}
              {expandedRow === 'server' && (
                <div className="px-4 py-2 bg-black/40 border-t border-white/5 space-y-1">
                  {[
                    { val: 'Server 1 (Fast)', ping: '18ms', desc: 'High-speed edge node' },
                    { val: 'Server 2 (Auto)', ping: '24ms', desc: 'Adaptive regional mirror' },
                    { val: 'Server 3 (HD)', ping: '32ms', desc: 'Direct fallback stream' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        setStreamingServer(item.val);
                        setExpandedRow(null);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
                    >
                      <div>
                        <span className={`text-xs font-semibold block ${streamingServer === item.val ? 'text-white' : 'text-zinc-300'}`}>
                          {item.val}
                        </span>
                        <span className="text-[10px] text-zinc-500">{item.desc} • {item.ping}</span>
                      </div>
                      {streamingServer === item.val && <Check size={14} className="text-zinc-200" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* HDR Toggle Row */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <Zap size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">HDR & Dolby Vision</span>
                  <span className="text-[11px] text-zinc-400">Enhanced colors on supported screens</span>
                </div>
              </div>

              <button
                onClick={() => setHdrEnabled(!hdrEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${hdrEnabled ? 'bg-green-500' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={hdrEnabled}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${hdrEnabled ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* 4. Playback Automation Vertical List */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2 block">
            Playback Automation
          </span>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
            
            {/* Autoplay Row */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <Play size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">Autoplay Next Episode</span>
                  <span className="text-[11px] text-zinc-400">Continue next episode automatically</span>
                </div>
              </div>

              <button
                onClick={() => setAutoplay(!autoplay)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${autoplay ? 'bg-green-500' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={autoplay}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${autoplay ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Auto Skip Intro */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">Auto Skip Intro</span>
                  <span className="text-[11px] text-zinc-400">Skip show opening credits and titles</span>
                </div>
              </div>

              <button
                onClick={() => setSkipIntro(!skipIntro)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${skipIntro ? 'bg-green-500' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={skipIntro}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${skipIntro ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Hardware Acceleration */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <HardDrive size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">Hardware Acceleration</span>
                  <span className="text-[11px] text-zinc-400">GPU assisted decoding for smooth playback</span>
                </div>
              </div>

              <button
                onClick={() => setHardwareAccel(!hardwareAccel)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${hardwareAccel ? 'bg-green-500' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={hardwareAccel}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${hardwareAccel ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* 5. Audio & Subtitles Vertical List */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2 block">
            Audio & Subtitles
          </span>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
            
            {/* Audio Output */}
            <div>
              <button 
                onClick={() => toggleExpand('audio')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                    <Volume2 size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">Audio Format</span>
                    <span className="text-[11px] text-zinc-400">Surround sound channel profile</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span className="font-semibold">{audioFormat}</span>
                  {expandedRow === 'audio' ? <ChevronDown size={15} className="text-zinc-400" /> : <ChevronRight size={15} className="text-zinc-500" />}
                </div>
              </button>

              {expandedRow === 'audio' && (
                <div className="px-4 py-2 bg-black/40 border-t border-white/5 space-y-1">
                  {['Stereo 2.0', 'Dolby 5.1 Surround', 'Dolby Atmos'].map((aud) => (
                    <button
                      key={aud}
                      onClick={() => {
                        setAudioFormat(aud);
                        setExpandedRow(null);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
                    >
                      <span className={`text-xs font-semibold ${audioFormat === aud ? 'text-white' : 'text-zinc-300'}`}>{aud}</span>
                      {audioFormat === aud && <Check size={14} className="text-zinc-200" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitle Size */}
            <div>
              <button 
                onClick={() => toggleExpand('subtitle')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">Subtitle Size</span>
                    <span className="text-[11px] text-zinc-400">Caption font scale</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span className="font-semibold">{subSize}</span>
                  {expandedRow === 'subtitle' ? <ChevronDown size={15} className="text-zinc-400" /> : <ChevronRight size={15} className="text-zinc-500" />}
                </div>
              </button>

              {expandedRow === 'subtitle' && (
                <div className="px-4 py-2 bg-black/40 border-t border-white/5 space-y-1">
                  {['Small', 'Medium', 'Large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSubSize(size);
                        setExpandedRow(null);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
                    >
                      <span className={`text-xs font-semibold ${subSize === size ? 'text-white' : 'text-zinc-300'}`}>{size}</span>
                      {subSize === size && <Check size={14} className="text-zinc-200" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 6. Storage & System Data */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2 block">
            Storage & System
          </span>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
            
            {/* Clear Cache */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <Trash2 size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">Clear Local Cache</span>
                  <span className="text-[11px] text-zinc-400">Cached posters & temp data ({cacheSize})</span>
                </div>
              </div>

              <button
                onClick={handleClearCache}
                disabled={cacheCleared}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-medium transition cursor-pointer"
              >
                {cacheCleared ? (
                  <span className="text-green-400 font-semibold flex items-center gap-1">
                    <Check size={12} /> Cleared
                  </span>
                ) : (
                  <span>Clear</span>
                )}
              </button>
            </div>

            {/* App Status */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">TMDB Service Status</span>
                  <span className="text-[11px] text-zinc-400">Online & verified API</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Operational</span>
              </div>
            </div>

            {/* Version */}
            <div className="flex items-center justify-between p-3.5">
              <span className="text-sm font-medium text-zinc-400">Version</span>
              <span className="text-xs text-zinc-400 font-medium">Parlaxio v2.4.0</span>
            </div>

          </div>
        </div>

      </div>

      {/* Clean Minimal Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Sign In</h3>
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Name</label>
                <input 
                  type="text" 
                  value={inputName} 
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Alex Walker"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={inputEmail} 
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 transition"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

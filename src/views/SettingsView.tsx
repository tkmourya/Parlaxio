import { useState, useEffect } from 'react';
import {
  Shield, Bookmark, Play, ChevronRight, Check,
  Trash2, Film, Zap, HardDrive, Volume2, Globe,
  ArrowLeft, LogOut, CheckCircle2, ChevronDown, Clock, User,
  LayoutGrid, List
} from 'lucide-react';
import { WatchlistView } from './WatchlistView';
import { useAuth } from '../lib/AuthContext';
import { getWatchlist } from '../lib/storage';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { THEMES, saveTheme, loadTheme, saveDefaultServer, loadDefaultServer } from '../lib/preferences';

interface SettingsViewProps {
  onPlay: (id: number, type: 'movie' | 'tv') => void;
  onAuthClick: (mode: 'login' | 'register') => void;
  onSubViewChange?: (isSubView: boolean) => void;
  onNavigate?: (tab: any) => void;
}

export function SettingsView({ onPlay, onAuthClick, onSubViewChange, onNavigate }: SettingsViewProps) {
  // Navigation: null = settings list, 'watchlist' = opened watchlist, 'history' = opened history, 'profile' = profile editor, 'profile-view' = profile view
  const [subView, setSubView] = useState<'watchlist' | 'history' | 'profile' | 'profile-view' | null>(null);
  const [historyLayout, setHistoryLayout] = useState<'list' | 'grid'>('list');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Notify parent (App.tsx) when a subview opens/closes to hide navbars
  useEffect(() => {
    if (onSubViewChange) {
      onSubViewChange(subView !== null);
    }
  }, [subView, onSubViewChange]);

  // Settings State
  const [autoplay, setAutoplay] = useState(true);
  const [skipIntro, setSkipIntro] = useState(true);
  const [hdrEnabled, setHdrEnabled] = useState(true);
  const [hardwareAccel, setHardwareAccel] = useState(true);

  // Selectable options
  const [videoQuality, setVideoQuality] = useState('4K (2160p)');
  
  const [serverIdx, setServerIdx] = useState(loadDefaultServer());
  const [currentTheme, setCurrentTheme] = useState(loadTheme());
  
  const SERVERS = [
    { val: 0, label: 'Server 1 (VidLink)', ping: '18ms', desc: '4K & 1080p Ultra HD' },
    { val: 1, label: 'Server 2 (VidSrc SBS)', ping: '24ms', desc: 'High Speed Multi-Source HD' },
    { val: 2, label: 'Server 3 (VidCore)', ping: '32ms', desc: 'Alternative Fast Server' },
    { val: 3, label: 'Server 4 (2Embed)', ping: '45ms', desc: 'Stable Global CDN Node' },
    { val: 4, label: 'Server 5 (VidSrc Buzz)', ping: '50ms', desc: 'Reliable Streaming Network' },
    { val: 5, label: 'Server 6 (VidSrc CC)', ping: '42ms', desc: 'Reliable Streaming Network' },
    { val: 6, label: 'Server 7 (SmashS)', ping: '60ms', desc: 'Multi-Audio & Hindi Dub' }
  ];

  const [audioFormat, setAudioFormat] = useState('Dolby Atmos');
  const [subSize, setSubSize] = useState('Medium');

  // Expanded accordion sections (clean vertical inline expands)
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Cache state
  const [cacheSize, setCacheSize] = useState('24.6 MB');
  const [cacheCleared, setCacheCleared] = useState(false);

  // Watchlist count
  const [watchlistCount, setWatchlistCount] = useState(0);

  const { user, logout, updateProfile } = useAuth();

  const [profileName, setProfileName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) setProfileName(user.name);
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || profileName === user?.name) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfile(profileName);
      setSubView(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  const { history, clearHistory } = useWatchHistory();

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

  const toggleExpand = (rowName: string) => {
    setExpandedRow(expandedRow === rowName ? null : rowName);
  };

  const logoutModal = showLogoutConfirm && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 backdrop-blur-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Sign Out</h3>
        <p className="text-sm text-zinc-300 mb-6">Are you sure you want to sign out of your account?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLogoutConfirm(false)}
            className="flex-1 py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 border border-white/5 text-white transition cursor-pointer backdrop-blur-md"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setShowLogoutConfirm(false);
              logout();
            }}
            className="flex-1 py-2.5 rounded-xl font-medium bg-red-600/80 hover:bg-red-500 border border-red-500/50 text-white transition shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer backdrop-blur-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  // If user tapped "My Watchlist", render Watchlist in list layout with clean back button
  if (subView === 'watchlist') {
    return (
      <div className="px-4 md:px-8 lg:px-12 pt-8 md:pt-12 pb-12 min-h-screen text-white animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
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

  // If user tapped "Watch History"
  if (subView === 'history') {
    return (
      <div className="px-4 md:px-8 lg:px-12 pt-8 md:pt-12 pb-12 min-h-screen text-white animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSubView(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Settings</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-400">{history.length} Titles</span>

            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10 hidden sm:flex">
              <button
                onClick={() => setHistoryLayout('list')}
                className={`p-1.5 rounded-md transition ${historyLayout === 'list' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="List View"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setHistoryLayout('grid')}
                className={`p-1.5 rounded-md transition ${historyLayout === 'grid' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
            </div>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[10px] uppercase font-bold tracking-wider text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Clock size={24} className="text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Watch History</h3>
            <p className="text-sm text-zinc-400">Movies and shows you watch will appear here.</p>
          </div>
        ) : (
          <div className={historyLayout === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
            {history.map((movie) => (
              historyLayout === 'grid' ? (
                <div
                  key={movie.id}
                  onClick={() => onPlay(movie.id, movie.media_type || 'movie')}
                  className="relative group cursor-pointer aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800"
                >
                  <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
                    alt={movie.title || movie.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <button className="w-full py-2 bg-white text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5">
                        <Play size={12} className="fill-current" /> Resume
                      </button>
                    </div>
                  </div>
                  {movie.progress !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)] transition-all duration-300"
                        style={{ width: `${movie.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  key={movie.id}
                  onClick={() => onPlay(movie.id, movie.media_type || 'movie')}
                  className="group cursor-pointer flex items-center gap-4 bg-zinc-900/50 border border-white/5 p-2 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="relative w-16 md:w-20 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                    <img
                      src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster'}
                      alt={movie.title || movie.name}
                      className="w-full h-full object-cover"
                    />
                    {movie.progress !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-red-600"
                          style={{ width: `${movie.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-white text-sm md:text-base truncate">{movie.title || movie.name}</h4>
                    {movie.progress !== undefined && (
                      <p className="text-xs text-zinc-400 mt-1">{Math.floor(movie.progress)}% watched</p>
                    )}
                  </div>
                  <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    <button className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center pl-0.5 hover:scale-110 active:scale-95 transition-transform">
                      <Play size={14} className="fill-current" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    );
  }

  // If user tapped "Profile View"
  if (subView === 'profile-view') {
    const memberSince = user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A';

    return (
      <div className="px-4 md:px-8 lg:px-12 pt-8 md:pt-12 pb-12 min-h-screen text-white animate-in fade-in duration-300 max-w-4xl mx-auto w-full flex flex-col justify-start md:justify-center">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => setSubView(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 md:gap-8 items-stretch">
          {/* LEFT COLUMN: Avatar + Name + Email */}
          <div className="md:bg-zinc-900/80 md:border md:border-white/10 md:rounded-2xl p-2 md:p-8 md:backdrop-blur-xl flex flex-col items-center justify-center text-center h-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 flex items-center justify-center text-5xl font-extrabold text-black shadow-lg shadow-white/10 mb-4">
                {user ? user.avatarInitials : 'G'}
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{user ? user.name : 'Guest User'}</h2>
              <p className="text-sm text-zinc-400 mt-1 break-all w-full">{user ? user.email : 'Not signed in'}</p>
              {user?.plan && (
                <span className="mt-4 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-gradient-to-r from-white/10 to-white/5 text-zinc-200 border border-white/10 tracking-wider">
                  {user.plan}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Info, Stats, Actions */}
          <div className="flex flex-col gap-4">
            {/* Account Info & Stats */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-zinc-400">Member Since</span>
                <span className="text-sm font-medium text-white">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-zinc-400">Account ID</span>
                <span className="text-xs font-mono text-zinc-500 truncate max-w-[160px] md:max-w-xs">{user?.id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-zinc-400">My Watchlist</span>
                <span className="text-sm font-medium text-white">{watchlistCount} Titles</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-zinc-400">Watch History</span>
                <span className="text-sm font-medium text-white">{history.length} Watched</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md mt-2">
              <button
                onClick={() => setSubView('profile')}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium text-white">Edit Profile</span>
                </div>
                <ChevronRight size={16} className="text-zinc-500" />
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                    <LogOut size={16} />
                  </div>
                  <span className="text-sm font-medium text-red-400">Sign Out</span>
                </div>
              </button>
            </div>

            {/* App Info */}
            <div className="text-left mt-2 pl-2">
              <p className="text-[11px] text-zinc-500 font-medium">Parlaxio v2.4.0 <span className="mx-1">•</span> Powered by TMDB</p>
            </div>
          </div>
        </div>
        {logoutModal}
      </div>
    );
  }

  // If user tapped "Edit Profile"
  if (subView === 'profile') {
    return (
      <div className="px-4 md:px-8 lg:px-12 pt-8 md:pt-12 pb-12 min-h-screen text-white animate-in fade-in duration-300 max-w-xl mx-auto w-full flex flex-col justify-start md:justify-center">
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => setSubView(user ? 'profile-view' : null)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>

        <div className="md:bg-zinc-900/80 md:border md:border-white/10 md:rounded-2xl p-2 md:p-8 md:backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 flex items-center justify-center text-4xl md:text-5xl font-extrabold text-black shadow-lg shadow-white/10 mb-4">
              {user ? user.avatarInitials : 'G'}
            </div>
            <p className="text-zinc-400 text-sm">Avatar is generated from your name</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Display Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="w-full bg-zinc-800/50 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-zinc-500"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-zinc-800/30 border border-white/5 text-zinc-500 rounded-xl px-4 py-3 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-2">Email cannot be changed directly.</p>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSubView(user ? 'profile-view' : null)}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingProfile || profileName === user?.name}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 pt-8 md:pt-12 pb-12 min-h-screen text-white animate-in fade-in duration-300 max-w-2xl mx-auto w-full">

      {/* Minimal Header with Back Button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
      </div>

      <div className="space-y-6">

        {/* 1. Profile / Account Row */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div
              className={`flex items-center gap-3.5 overflow-hidden ${user ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={() => user && setSubView('profile-view')}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 flex items-center justify-center text-sm font-bold text-black shrink-0 shadow-sm shadow-white/10">
                {user ? user.avatarInitials : 'G'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {user ? user.name : 'Guest User'}
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                    {user ? 'VIP' : 'Free'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {user ? user.email : 'Sign in to sync your watchlist'}
                </p>
              </div>
            </div>

            {user ? (
              <div className="flex items-center gap-2 shrink-0">

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAuthClick('login')}
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

            {/* Watch History Button */}
            <button
              onClick={() => setSubView('history')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <span className="text-sm font-medium text-white block">Watch History</span>
                  <span className="text-[11px] text-zinc-400">Continue watching your recent shows</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {history.length}
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
                    <span className="text-sm font-medium text-white block">Server</span>
                    <span className="text-[11px] text-zinc-400">Content delivery provider</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-300 ml-4 overflow-hidden flex-shrink-0 max-w-[130px] sm:max-w-none">
                  <span className="font-semibold truncate block w-full text-right">{SERVERS.find(s => s.val === serverIdx)?.label || 'Server 1'}</span>
                  {expandedRow === 'server' ? <ChevronDown size={15} className="text-zinc-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-zinc-500 flex-shrink-0" />}
                </div>
              </button>

              {/* Vertical Server Options Accordion */}
              {expandedRow === 'server' && (
                <div className="px-4 py-2 bg-black/40 border-t border-white/5 space-y-1">
                  {SERVERS.map((item) => (
                    <button
                      key={item.val}
                      onClick={() => {
                        setServerIdx(item.val);
                        saveDefaultServer(item.val);
                        setExpandedRow(null);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
                    >
                      <div>
                        <span className={`text-xs font-semibold block ${serverIdx === item.val ? 'text-white' : 'text-zinc-300'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-zinc-500">{item.desc} • {item.ping}</span>
                      </div>
                      {serverIdx === item.val && <Check size={14} className="text-zinc-200" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Row */}
            <div>
              <button
                onClick={() => toggleExpand('theme')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center">
                    <LayoutGrid size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white block">App Theme</span>
                    <span className="text-[11px] text-zinc-400">Choose your vibe</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-300 ml-4 overflow-hidden flex-shrink-0 max-w-[130px] sm:max-w-none">
                  <span className="font-semibold truncate block w-full text-right">{THEMES.find(t => t.id === currentTheme)?.name || 'Default'}</span>
                  {expandedRow === 'theme' ? <ChevronDown size={15} className="text-zinc-400 flex-shrink-0" /> : <ChevronRight size={15} className="text-zinc-500 flex-shrink-0" />}
                </div>
              </button>

              {/* Vertical Theme Options Accordion */}
              {expandedRow === 'theme' && (
                <div className="px-4 py-2 bg-black/40 border-t border-white/5 space-y-1">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setCurrentTheme(theme.id);
                        saveTheme(theme.id);
                      }}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: theme.color }}></div>
                        <div>
                          <span className={`text-xs font-semibold block ${currentTheme === theme.id ? 'text-white' : 'text-zinc-300'}`}>
                            {theme.name}
                          </span>
                          <span className="text-[10px] text-zinc-500">{theme.desc}</span>
                        </div>
                      </div>
                      {currentTheme === theme.id && <Check size={14} className="text-zinc-200" />}
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
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${hdrEnabled ? 'bg-gradient-to-r from-white via-zinc-200 to-zinc-400 shadow-inner' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={hdrEnabled}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hdrEnabled ? 'left-5.5 bg-black' : 'left-0.5 bg-white'}`} />
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
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${autoplay ? 'bg-gradient-to-r from-white via-zinc-200 to-zinc-400 shadow-inner' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={autoplay}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${autoplay ? 'left-5.5 bg-black' : 'left-0.5 bg-white'}`} />
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
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${skipIntro ? 'bg-gradient-to-r from-white via-zinc-200 to-zinc-400 shadow-inner' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={skipIntro}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${skipIntro ? 'left-5.5 bg-black' : 'left-0.5 bg-white'}`} />
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
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${hardwareAccel ? 'bg-gradient-to-r from-white via-zinc-200 to-zinc-400 shadow-inner' : 'bg-zinc-700'}`}
                role="switch"
                aria-checked={hardwareAccel}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hardwareAccel ? 'left-5.5 bg-black' : 'left-0.5 bg-white'}`} />
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

        {/* 6. Legal & Information */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2 block">
            Legal & Information
          </span>
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md">
            
            <button
              onClick={() => onNavigate && onNavigate('privacy')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-white">
                Privacy Policy
              </div>
              <ChevronRight size={15} className="text-zinc-500" />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('terms')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-white">
                Terms & Conditions
              </div>
              <ChevronRight size={15} className="text-zinc-500" />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('legal')}
              className="w-full flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-white">
                Legal & DMCA
              </div>
              <ChevronRight size={15} className="text-zinc-500" />
            </button>

          </div>
        </div>

        {/* 7. Storage & System Data */}
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
                  <span className="text-sm font-medium text-white block">Service Status</span>
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

      {logoutModal}
    </div>
  );
}

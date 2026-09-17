import { useEffect, useState } from 'react';
import { ArrowLeft, LayoutGrid, List, Play, Search, Tv } from 'lucide-react';
import { LivePlayer } from '../components/LivePlayer';
import { useAuth } from '../lib/AuthContext';

let cachedChannels: Channel[] | null = null;

export interface Channel {
  id: string;
  name: string;
  logo: string;
  group: string;
  url: string;
}

interface LiveTVViewProps {
  onBack: () => void;
  onRequireAuth?: () => void;
}

export function LiveTVView({ onBack, onRequireAuth }: LiveTVViewProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [tier, setTier] = useState<'Free' | 'Premium'>('Free');
  const [playingChannel, setPlayingChannel] = useState<Channel | null>(null);

  // Helper to identify likely premium/geo-blocked networks
  const isPremium = (name: string) => {
    const premiumNetworks = ['star', 'sony', 'colors', 'zee', '&tv', '&xplor', 'hbo', 'cinemax', 'sports', 'ten 1', 'ten 2', 'ten 3', 'geo-bloc', 'mtv', 'vh1', 'movies', 'pictures', 'utv'];
    const lowerName = name.toLowerCase();
    return premiumNetworks.some(kw => lowerName.includes(kw));
  };

  useEffect(() => {
    async function fetchChannels() {
      if (cachedChannels) {
        setChannels(cachedChannels);
        setLoading(false);
        return;
      }

      try {
        // comma lagakar aur bhi .m3u links add kar sakte hain
        const playlists = [
          'https://iptv-org.github.io/iptv/countries/in.m3u',
          // 'http://localhost:5001/playlist.m3u' // Future JioTV-Go link
        ];

        let allParsedChannels: Channel[] = [];

        for (const url of playlists) {
          try {
            const response = await fetch(url);
            const text = await response.text();

            const lines = text.split('\n');
            let currentChannel: Partial<Channel> = {};

            lines.forEach(line => {
              line = line.trim();
              if (line.startsWith('#EXTINF:')) {
                const logoMatch = line.match(/tvg-logo="([^"]*)"/);
                const groupMatch = line.match(/group-title="([^"]*)"/);
                const nameMatch = line.split(',').pop();

                currentChannel = {
                  id: Math.random().toString(36).substr(2, 9),
                  logo: logoMatch ? logoMatch[1] : '',
                  group: groupMatch ? groupMatch[1] : 'Uncategorized',
                  name: nameMatch ? nameMatch.trim() : 'Unknown Channel'
                };
              } else if (line && !line.startsWith('#')) {
                if (currentChannel.name) {
                  currentChannel.url = line;
                  allParsedChannels.push(currentChannel as Channel);
                  currentChannel = {};
                }
              }
            });
          } catch (err) {
            console.error(`Failed to load playlist from ${url}:`, err);
          }
        }

        // Remove exact duplicates if any
        const uniqueChannels = Array.from(new Map(allParsedChannels.map(item => [item.url, item])).values());
        cachedChannels = uniqueChannels;
        setChannels(uniqueChannels);
      } catch (error) {
        console.error("Failed to load IPTV channels:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchChannels();
  }, []);

  // Filter channels based on search, group, and tier
  const filteredChannels = channels.filter(channel => {
    const isPremiumChannel = isPremium(channel.name);
    const matchesTier = tier === 'Premium' ? isPremiumChannel : !isPremiumChannel;

    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || channel.group === selectedGroup;

    return matchesTier && matchesSearch && matchesGroup;
  });

  // Extract unique groups based on CURRENT tier only
  const groups = ['All', ...Array.from(new Set(channels.filter(c => (tier === 'Premium' ? isPremium(c.name) : !isPremium(c.name))).map(c => c.group)))].filter(Boolean);

  useEffect(() => {
    const handlePopState = () => {
      if (playingChannel) {
        setPlayingChannel(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [playingChannel]);

  const handleChannelClick = (channel: Channel) => {
    if (!user && onRequireAuth) {
      onRequireAuth();
      return;
    }
    if (!playingChannel) {
      window.history.pushState({ livePlayer: true }, '');
    }
    setPlayingChannel(channel);
  };

  return (
    <>
      {playingChannel && (
        <LivePlayer
          url={playingChannel.url}
          poster={playingChannel.logo}
          onClose={() => {
            setPlayingChannel(null);
            window.history.back();
          }}
        />
      )}
      <div className={`px-4 md:px-8 lg:px-12 pt-6 md:pt-8 pb-36 min-h-screen text-white animate-in fade-in duration-300 max-w-7xl mx-auto w-full ${playingChannel ? 'hidden' : ''}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">

        {/* 1. Title Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Tv className="text-red-500" />
            Live TV <span className="text-sm font-normal text-zinc-400 bg-white/10 px-2 py-0.5 rounded-md hidden sm:inline-block">India</span>
          </h1>
        </div>

        {/* 2. Free/Premium Toggle */}
        <div className="flex bg-zinc-900 rounded-full p-1 self-start lg:self-center shrink-0">
          <button
            onClick={() => { setTier('Free'); setSelectedGroup('All'); }}
            className={`px-5 py-1.5 text-sm rounded-full transition ${tier === 'Free' ? 'bg-white/15 text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Free Channels
          </button>
          <button
            onClick={() => { setTier('Premium'); setSelectedGroup('All'); }}
            className={`px-5 py-1.5 text-sm rounded-full transition flex items-center gap-1.5 ${tier === 'Premium' ? 'bg-amber-500/20 text-amber-500 font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Premium <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 rounded-sm font-bold tracking-wide">PRO</span>
          </button>
        </div>

        {/* 3. Search & Grid/List */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 transition"
            />
          </div>
          <div className="flex bg-zinc-900 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setLayout('grid')}
              className={`p-1.5 rounded-lg transition ${layout === 'grid' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-1.5 rounded-lg transition ${layout === 'list' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>



      {/* Categories */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-6 hide-scrollbar">
        {groups.map(group => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedGroup === group
                ? 'bg-red-600 text-white'
                : 'bg-zinc-900/50 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-video bg-zinc-900 rounded-xl"></div>
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tv size={48} className="text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No channels found</h3>
          <p className="text-zinc-400">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className={
          layout === 'grid'
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            : "flex flex-col gap-3"
        }>
          {filteredChannels.map(channel => (
            layout === 'grid' ? (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="group relative bg-zinc-900 ring-1 ring-white/10 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 hover:ring-white/20"
              >
                <div className="aspect-video bg-black flex items-center justify-center p-4 relative">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute font-bold text-xl text-zinc-600 uppercase tracking-widest ${channel.logo ? 'hidden' : ''}`}>
                    {channel.name.substring(0, 3)}
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white pl-1 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                      <Play size={24} className="fill-current" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-white truncate" title={channel.name}>{channel.name}</h3>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{channel.group}</span>
                </div>
              </div>
            ) : (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="group flex items-center gap-4 bg-zinc-900/50 p-3 rounded-xl ring-1 ring-white/10 hover:ring-white/20 hover:bg-white/5 transition cursor-pointer"
              >
                <div className="w-20 sm:w-24 aspect-video bg-black rounded-lg flex items-center justify-center p-1 sm:p-2 relative shrink-0">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute font-bold text-xs text-zinc-600 uppercase ${channel.logo ? 'hidden' : ''}`}>
                    {channel.name.substring(0, 3)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base truncate">{channel.name}</h3>
                  <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md mt-1 inline-block">{channel.group}</span>
                </div>
                <div className="pr-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center gap-2">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider animate-pulse">Live</span>
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white pl-1 hover:bg-red-600 transition-colors">
                    <Play size={18} className="fill-current" />
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
    </>
  );
}

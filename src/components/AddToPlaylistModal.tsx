import { useState, useEffect } from 'react';
import { Plus, X, ListPlus, CheckCircle2, Lock, Globe } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { fetchUserCustomPlaylists, createCustomPlaylist, updateCustomPlaylistItems } from '../lib/sync';
import { CustomPlaylist } from '../types';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // The song/item to add
}

export function AddToPlaylistModal({ isOpen, onClose, item }: AddToPlaylistModalProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New playlist state
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadPlaylists();
    }
  }, [isOpen, user]);

  const loadPlaylists = async () => {
    setLoading(true);
    if (user) {
      const data = await fetchUserCustomPlaylists(user.id);
      setPlaylists(data);
    }
    setLoading(false);
  };

  const handleCreateAndAdd = async () => {
    if (!user || !newPlaylistName.trim()) return;
    
    setSavingId('new');
    try {
      const playlist = await createCustomPlaylist(
        user.id,
        user.name || 'User',
        newPlaylistName.trim(),
        isPublic,
        [item] // Start with this item
      );
      
      setPlaylists([playlist, ...playlists]);
      setIsCreating(false);
      setNewPlaylistName('');
      setTimeout(() => onClose(), 1000);
    } catch (e) {
      alert('Failed to create playlist');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddToExisting = async (playlist: CustomPlaylist) => {
    if (savingId) return;
    setSavingId(playlist.$id!);
    
    try {
      // Check if already in playlist
      const isAlreadyIn = playlist.items.some((i: any) => i.id === item.id);
      if (isAlreadyIn) {
        alert('Item already in playlist!');
        setSavingId(null);
        return;
      }
      
      const newItems = [...playlist.items, item];
      await updateCustomPlaylistItems(playlist.$id!, newItems);
      
      // Update local state
      setPlaylists(playlists.map(p => p.$id === playlist.$id ? { ...p, items: newItems } : p));
      setTimeout(() => onClose(), 1000);
    } catch (e) {
      alert('Failed to add to playlist');
    } finally {
      setSavingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ListPlus size={20} className="text-white" />
            Add to Playlist
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {!user ? (
            <div className="text-center py-8 text-zinc-400">
              <p>Please log in to create playlists.</p>
            </div>
          ) : isCreating ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">Playlist Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Mix"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/5 transition"
                  autoFocus
                />
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border transition ${isPublic ? 'bg-white/10 border-white/20 text-white shadow-sm' : 'border-white/5 bg-black/20 text-zinc-500 hover:text-white hover:bg-white/5'}`}
                >
                  <Globe size={16} />
                  <span className="text-sm font-medium">Public</span>
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border transition ${!isPublic ? 'bg-white/10 border-white/20 text-white shadow-sm' : 'border-white/5 bg-black/20 text-zinc-500 hover:text-white hover:bg-white/5'}`}
                >
                  <Lock size={16} />
                  <span className="text-sm font-medium">Private</span>
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-white/10 hover:bg-white/20 text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newPlaylistName.trim() || savingId === 'new'}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-white hover:bg-zinc-200 text-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingId === 'new' ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Plus size={18} />}
                  Create
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-dashed border-white/20 hover:border-white/40 text-white transition group"
              >
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition">
                  <Plus size={20} className="text-zinc-400 group-hover:text-white transition" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium">New Playlist</h4>
                  <p className="text-xs text-zinc-500">Create a custom playlist</p>
                </div>
              </button>

              {loading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                </div>
              ) : playlists.length > 0 ? (
                <>
                  <div className="h-px w-full bg-white/10 my-4" />
                  <div className="space-y-2">
                    {playlists.map(playlist => {
                      const isAlreadyIn = playlist.items.some((i: any) => i.id === item.id);
                      const isSavingThis = savingId === playlist.$id;
                      
                      return (
                        <button
                          key={playlist.$id}
                          onClick={() => handleAddToExisting(playlist)}
                          disabled={isAlreadyIn || savingId !== null}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left group ${
                            isAlreadyIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/5">
                            {playlist.coverUrl ? (
                              <img src={playlist.coverUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                <ListPlus size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{playlist.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <span>{playlist.items.length} items</span>
                              <span>•</span>
                              {playlist.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                            </div>
                          </div>
                          {isSavingThis ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          ) : isAlreadyIn ? (
                            <CheckCircle2 size={18} className="text-green-500 mr-2" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

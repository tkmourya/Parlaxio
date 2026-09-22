import React, { useState } from 'react';

interface ArtistAvatarProps {
  src?: string;
  name: string;
  className?: string;
  imgClassName?: string;
  textClassName?: string;
  isArtist?: boolean;
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return clean.substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic gradient selection based on name
const GRADIENTS = [
  'from-indigo-600 via-purple-700 to-pink-600',
  'from-rose-600 via-red-700 to-amber-600',
  'from-emerald-600 via-teal-700 to-cyan-600',
  'from-blue-600 via-indigo-700 to-violet-600',
  'from-violet-600 via-purple-800 to-indigo-900',
  'from-amber-600 via-orange-700 to-red-600',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export const ArtistAvatar: React.FC<ArtistAvatarProps> = ({
  src,
  name,
  className = '',
  imgClassName = '',
  textClassName = '',
  isArtist = true,
}) => {
  const [hasError, setHasError] = useState(false);

  const initials = getInitials(name);
  const gradient = getGradient(name);

  if (!src || hasError) {
    return (
      <div
        className={`bg-gradient-to-br ${gradient} border border-white/20 shadow-xl flex items-center justify-center font-extrabold text-white uppercase select-none ${
          isArtist ? 'rounded-full' : 'rounded-xl'
        } ${className}`}
        title={name}
      >
        <span className={textClassName || 'text-base md:text-xl font-bold tracking-wider'}>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      className={`${imgClassName || 'w-full h-full object-cover'} ${
        isArtist ? 'rounded-full' : 'rounded-xl'
      } ${className}`}
    />
  );
};

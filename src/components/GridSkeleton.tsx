import React, { useState, useEffect } from 'react';

export function GridSkeleton({ count = 12 }: { count?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return <div className="min-h-screen" />; // Blank placeholder for 150ms

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 w-full animate-in fade-in duration-500">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[2/3] w-full bg-zinc-800/80 rounded-2xl animate-pulse shadow-lg border border-white/5" />
          <div className="h-4 bg-zinc-800/80 rounded w-3/4 animate-pulse mt-1" />
          <div className="h-3 bg-zinc-800/80 rounded w-1/2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

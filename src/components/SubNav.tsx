export function SubNav({ filters, current, onChange }: { filters: {id: string, label: string}[], current: string, onChange: (id: string) => void }) {
  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2 snap-x px-1">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`snap-start whitespace-nowrap px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all text-[13px] md:text-sm ${
            current === f.id
              ? 'bg-white/20 text-white font-semibold shadow-inner'
              : 'bg-white/5 text-white/60 font-medium hover:text-white hover:bg-white/10'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function SubNav({ filters, current, onChange }: { filters: {id: string, label: string}[], current: string, onChange: (id: string) => void }) {
  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-3 mb-8 pb-2 snap-x md:justify-center">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`snap-start whitespace-nowrap px-5 py-2 rounded-full font-medium transition-colors ${
            current === f.id
              ? 'bg-white/20 text-white shadow-inner'
              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

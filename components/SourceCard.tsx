'use client';

interface Source {
  id: string; parva: string; adhyaya: string;
  episode: string; topic: string; text: string; score: number;
}

export function SourceCard({ source, index }: { source: Source; index: number }) {
  const pct = Math.round(source.score * 100);

  return (
    <div className="card-3d rounded-lg overflow-hidden cursor-default"
      style={{
        background: 'linear-gradient(160deg, #1C1540 0%, #110D2A 100%)',
        border: '1px solid #32226A',
      }}>

      {/* Chakra top bar — saffron fire to lotus */}
      <div className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--saffron), var(--gold-light), var(--lotus), transparent)' }} />

      <div className="p-3 sm:p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-display text-xs font-semibold"
              style={{ color: 'var(--gold-light)', letterSpacing: '0.08em' }}>
              [{index + 1}] {source.parva}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gold-dim)' }}>
              {source.adhyaya}
            </p>
          </div>

          {/* Score badge */}
          <div className="flex-shrink-0 relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke="#221A4A" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke="var(--gold)" strokeWidth="3"
                strokeDasharray={`${pct} 100`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-[9px] font-bold"
              style={{ color: 'var(--gold)' }}>
              {pct}%
            </span>
          </div>
        </div>

        {/* Episode */}
        <p className="text-xs italic mb-1.5" style={{ color: 'var(--parchment-dim)' }}>
          {source.episode}
        </p>

        {/* Topic */}
        <p className="text-[11px] mb-3 font-display tracking-wide uppercase"
          style={{ color: 'var(--gold-dim)' }}>
          {source.topic}
        </p>

        {/* Divider */}
        <div className="mb-3 h-px"
          style={{ background: 'linear-gradient(90deg, var(--gold-dim), transparent)' }} />

        {/* Passage text */}
        <p className="text-xs leading-relaxed font-body"
          style={{ color: 'var(--parchment)', opacity: 0.85 }}>
          "{source.text}"
        </p>
      </div>
    </div>
  );
}

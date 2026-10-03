'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CHARACTERS, type Character } from '@/lib/characters';

interface Source {
  id: string; parva: string; adhyaya: string; episode: string;
  topic: string; text: string; score: number; url: string;
}

/* ── Inline citation parser (same rule as the Oracle page: only
   render a link for [Source N] tags the answer actually used) ── */
function ParsedAnswer({ text, sources, accent }: { text: string; sources: Source[]; accent: string }) {
  const parts = text.split(/(\[Source \d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/\[Source (\d+)\]/);
        if (m) {
          const src = sources[parseInt(m[1], 10) - 1];
          return src?.url ? (
            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
              className="font-display text-[11px] px-1 py-0.5 rounded"
              style={{ color: accent, background: `${accent}15`, border: `1px solid ${accent}50`, textDecoration: 'none', whiteSpace: 'nowrap' }}
              title={`${src.parva} — ${src.adhyaya}`}>
              {part} ↗
            </a>
          ) : <span key={i}>{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ── Streaming helper ─────────────────────────────── */
async function streamFromQuery(
  query: string,
  character: string,
  onSources: (s: Source[]) => void,
  onText: (t: string) => void,
): Promise<string> {
  const res = await fetch('/api/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, character }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let sourcesHandled = false;
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    if (!sourcesHandled) {
      const nl = buffer.indexOf('\n');
      if (nl !== -1) {
        const firstLine = buffer.slice(0, nl);
        if (firstLine.startsWith('__SOURCES__')) {
          onSources(JSON.parse(firstLine.slice(11)));
        }
        sourcesHandled = true;
        buffer = buffer.slice(nl + 1);
      }
    }

    if (sourcesHandled) {
      accumulated += buffer;
      buffer = '';
      onText(accumulated);
    }
  }

  return accumulated;
}

/* ── Mandala SVG ──────────────────────────────────── */
function Mandala({ className }: { className?: string }) {
  const rings = [175, 148, 118, 88, 60, 35, 16];
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  const outerPetals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      {spokes.map(a => (
        <line key={a} x1="200" y1="24" x2="200" y2="376"
          transform={`rotate(${a} 200 200)`}
          stroke="#C9A84C" strokeWidth="0.3" opacity="0.35" />
      ))}
      {outerPetals.map(a => (
        <ellipse key={`op${a}`} cx="200" cy="80" rx="11" ry="55"
          transform={`rotate(${a} 200 200)`}
          fill="none" stroke="#C9A84C" strokeWidth="0.7" opacity="0.55" />
      ))}
      {rings.map(r => (
        <circle key={r} cx="200" cy="200" r={r}
          fill="none" stroke="#C9A84C" strokeWidth="0.55" opacity="0.5" />
      ))}
      <circle cx="200" cy="200" r="10" fill="#C9A84C" opacity="0.6" />
      <circle cx="200" cy="200" r="5" fill="#E5C86B" opacity="0.9" />
    </svg>
  );
}

/* ── Lotus divider ────────────────────────────────── */
function LotusDivider({ label }: { label?: string }) {
  return (
    <div className="ornament-line text-xs font-display tracking-[0.2em] uppercase"
      style={{ color: 'var(--gold-dim)' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2C12 2 8 7 8 12C8 16 10 20 12 22C14 20 16 16 16 12C16 7 12 2 12 2Z"
          fill="none" stroke="#8A7235" strokeWidth="1.2" />
        <path d="M2 12C2 12 7 8 12 8C16 8 20 10 22 12C20 14 16 16 12 16C7 16 2 12 2 12Z"
          fill="none" stroke="#8A7235" strokeWidth="1.2" />
      </svg>
      {label && <span>{label}</span>}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden
        style={{ transform: 'scaleX(-1)' }}>
        <path d="M12 2C12 2 8 7 8 12C8 16 10 20 12 22C14 20 16 16 16 12C16 7 12 2 12 2Z"
          fill="none" stroke="#8A7235" strokeWidth="1.2" />
        <path d="M2 12C2 12 7 8 12 8C16 8 20 10 22 12C20 14 16 16 12 16C7 16 2 12 2 12Z"
          fill="none" stroke="#8A7235" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

/* ── Character selector card ──────────────────────── */
function CharCard({
  char, selected, onSelect, disabled,
}: {
  char: Character; selected: boolean; onSelect: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className="relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg transition-all duration-300 cursor-pointer"
      style={{
        background: selected ? char.bg : 'var(--stone-mid)',
        border: `1px solid ${selected ? char.accent : '#2A1F55'}`,
        boxShadow: selected
          ? `0 0 18px ${char.accent}40, 0 0 36px ${char.accent}18, 0 4px 14px rgba(0,0,0,0.6)`
          : '0 2px 6px rgba(0,0,0,0.5)',
        minWidth: '72px',
        opacity: disabled ? 0.45 : 1,
        transform: selected ? 'translateY(-2px)' : 'none',
      }}
    >
      <span className="text-2xl leading-none select-none">{char.symbol}</span>
      <span className="font-display text-[11px] font-semibold leading-tight text-center"
        style={{ color: selected ? char.accent : 'var(--parchment-dim)', letterSpacing: '0.04em' }}>
        {char.name}
      </span>
      {selected && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
          style={{ background: char.accent, boxShadow: `0 0 6px ${char.accent}` }} />
      )}
    </button>
  );
}

/* ── Single debate panel ──────────────────────────── */
function DebatePanel({
  char, answer, sources, loading,
}: {
  char: Character; answer: string; sources: Source[]; loading: boolean;
}) {
  const hasContent = answer || loading;
  return (
    <div className="flex-1 rounded-xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #1A1438 0%, #100C24 100%)',
        border: `1px solid ${char.accent}50`,
        boxShadow: `0 0 30px ${char.accent}12 inset, 0 4px 24px rgba(0,0,0,0.6)`,
        minHeight: '280px',
      }}>
      {/* Panel header */}
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${char.accent}30`, background: char.bg }}>
        <span className="text-2xl" style={{ filter: `drop-shadow(0 0 8px ${char.accent})` }}>
          {char.symbol}
        </span>
        <div>
          <p className="font-display text-sm font-bold" style={{ color: char.accent, letterSpacing: '0.1em' }}>
            {char.name.toUpperCase()}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--parchment-dim)' }}>{char.title}</p>
        </div>
        <div className="ml-auto text-[10px] font-display tracking-widest uppercase"
          style={{ color: `${char.accent}80` }}>
          {char.philosophy}
        </div>
      </div>

      {/* Panel body */}
      <div className="p-4 flex-1">
        {!hasContent && (
          <p className="text-sm font-body italic text-center mt-8" style={{ color: 'var(--parchment-dim)', opacity: 0.5 }}>
            Awaiting the debate to begin…
          </p>
        )}
        {loading && !answer && (
          <div className="flex items-center gap-2 mt-4" style={{ color: char.accent }}>
            <span className="text-lg animate-glow">{char.symbol}</span>
            <span className="text-sm font-body italic">
              {char.name} consults the sacred texts…
            </span>
          </div>
        )}
        {answer && (
          <p className="answer-prose whitespace-pre-wrap text-[0.88rem]">
            <ParsedAnswer text={answer} sources={sources} accent={char.accent} />
            {loading && <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
              style={{ background: char.accent, verticalAlign: 'middle' }} />}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Main debate page ─────────────────────────────── */
const EXAMPLE_TOPICS = [
  'How should a leader handle betrayal by a trusted ally?',
  'Is absolute loyalty a virtue or a weakness in leadership?',
  'Can deception ever be justified in service of a greater good?',
  'How does a true warrior face certain defeat with dignity?',
];

export default function DebatePage() {
  const [char1, setChar1] = useState('krishna');
  const [char2, setChar2] = useState('karna');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [sources1, setSources1] = useState<Source[]>([]);
  const [sources2, setSources2] = useState<Source[]>([]);
  const [fullAnswer1, setFullAnswer1] = useState('');
  const [fullAnswer2, setFullAnswer2] = useState('');

  const [bothDone, setBothDone] = useState(false);
  const [synthesis, setSynthesis] = useState('');
  const [synthesizing, setSynthesizing] = useState(false);

  const c1 = CHARACTERS.find(c => c.id === char1)!;
  const c2 = CHARACTERS.find(c => c.id === char2)!;

  async function handleDebate(t?: string) {
    const finalTopic = (t ?? topic).trim();
    if (!finalTopic || loading) return;
    if (char1 === char2) {
      setError('Please choose two different sages for the debate.');
      return;
    }

    setLoading(true);
    setAnswer1(''); setAnswer2('');
    setSources1([]); setSources2([]);
    setFullAnswer1(''); setFullAnswer2('');
    setBothDone(false);
    setSynthesis('');
    setError('');

    try {
      const [fa1, fa2] = await Promise.all([
        streamFromQuery(finalTopic, char1, setSources1, setAnswer1),
        streamFromQuery(finalTopic, char2, setSources2, setAnswer2),
      ]);
      setFullAnswer1(fa1);
      setFullAnswer2(fa2);
      setBothDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleSynthesis() {
    setSynthesizing(true);
    setSynthesis('');

    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, char1, answer1: fullAnswer1, char2, answer2: fullAnswer2 }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setSynthesis(acc);
      }
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSynthesizing(false);
    }
  }

  const hasDebate = answer1 || answer2 || loading;
  const topicToDisplay = topic;

  return (
    <div style={{ background: 'var(--stone-black)', minHeight: '100dvh' }}>

      {/* ── Header ──────────────────────────────── */}
      <header className="relative overflow-hidden text-center"
        style={{ background: 'linear-gradient(180deg, #080618 0%, #120D28 60%, #1A1035 100%)', borderBottom: '1px solid #2A1F55' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <div className="w-[600px] h-[600px] opacity-[0.07] animate-mandala">
            <Mandala className="w-full h-full" />
          </div>
        </div>
        <div className="h-[3px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, var(--saffron) 20%, var(--gold) 40%, var(--gold-light) 50%, var(--gold) 60%, var(--lotus) 80%, transparent 100%)' }} />

        <div className="relative z-10 py-5 px-4">
          <div className="text-3xl mb-1 select-none" style={{ color: 'var(--gold)', fontFamily: 'serif' }}>⚔</div>
          <h1 className="font-display font-bold mb-0.5"
            style={{ color: 'var(--gold-light)', fontSize: 'clamp(1.1rem, 4vw, 2rem)', letterSpacing: '0.12em' }}>
            THE GREAT DEBATE ARENA
          </h1>
          <p className="text-xs font-body italic mb-3" style={{ color: 'var(--parchment-dim)' }}>
            Two great minds of the Mahābhārata — one question — a collision of philosophies
          </p>
          <Link href="/"
            className="inline-flex items-center gap-1.5 text-xs font-display tracking-widest uppercase px-3 py-1.5 rounded transition-colors"
            style={{ color: 'var(--gold-dim)', border: '1px solid var(--gold-dim)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--gold)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--gold)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--gold-dim)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--gold-dim)'; }}>
            ← Return to Oracle
          </Link>
        </div>
        <div className="h-[1px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, var(--ajna), var(--saffron), var(--ajna), transparent)' }} />
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Character Selection ──────────────── */}
        <section>
          <LotusDivider label="Choose Your Debaters" />
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">

            {/* Side A */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${c1.accent}60)` }} />
                <p className="font-display text-xs tracking-[0.2em] uppercase"
                  style={{ color: c1.accent }}>Side A · {c1.name}</p>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${c1.accent}60, transparent)` }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {CHARACTERS.map(c => (
                  <CharCard key={c.id} char={c} selected={char1 === c.id}
                    onSelect={() => setChar1(c.id)} disabled={loading} />
                ))}
              </div>
            </div>

            {/* Side B */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${c2.accent}60)` }} />
                <p className="font-display text-xs tracking-[0.2em] uppercase"
                  style={{ color: c2.accent }}>Side B · {c2.name}</p>
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${c2.accent}60, transparent)` }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {CHARACTERS.map(c => (
                  <CharCard key={c.id} char={c} selected={char2 === c.id}
                    onSelect={() => setChar2(c.id)} disabled={loading} />
                ))}
              </div>
            </div>
          </div>

          {/* VS badge */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <div className="font-display text-base font-bold px-4 py-1 rounded"
              style={{ color: 'var(--parchment-dim)', border: '1px solid #2A1F55', background: 'var(--stone-dark)', letterSpacing: '0.3em' }}>
              <span style={{ color: c1.accent }}>{c1.symbol}</span>
              {' '}VS{' '}
              <span style={{ color: c2.accent }}>{c2.symbol}</span>
            </div>
          </div>
        </section>

        {/* ── Topic input ──────────────────────── */}
        <section>
          <LotusDivider label="Enter the Debate Topic" />
          <div className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                className="flex-1 temple-input px-4 py-3 rounded text-sm font-body"
                style={{ color: 'var(--parchment)', border: '1px solid var(--gold-dim)' }}
                placeholder="Ask a question of leadership, dharma, or strategy…"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDebate()}
                disabled={loading}
              />
              <button
                onClick={() => handleDebate()}
                disabled={loading || !topic.trim() || char1 === char2}
                className="btn-saffron w-full sm:w-auto px-6 py-3 rounded text-sm font-display font-semibold"
                style={{ color: '#fff', letterSpacing: '0.1em' }}>
                {loading ? '⏳' : '⚔ BEGIN DEBATE'}
              </button>
            </div>

            {/* Example topics */}
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_TOPICS.map(t => (
                <button key={t} onClick={() => { setTopic(t); handleDebate(t); }}
                  disabled={loading}
                  className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-body transition-colors"
                  style={{ background: 'var(--stone-mid)', border: '1px solid var(--gold-dim)', color: 'var(--parchment-dim)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}>
                  {t}
                </button>
              ))}
            </div>

            {char1 === char2 && (
              <p className="text-xs font-body" style={{ color: 'var(--saffron)' }}>
                ⚠ A sage cannot debate themselves — choose two different voices.
              </p>
            )}
          </div>
        </section>

        {/* ── Error ───────────────────────────── */}
        {error && (
          <div className="rounded px-4 py-3 text-sm font-body"
            style={{ background: '#1A0820', border: '1px solid var(--crimson)', color: '#F4A0C0' }}>
            {error}
          </div>
        )}

        {/* ── Debate panels ────────────────────── */}
        {hasDebate && (
          <section className="animate-fade-up">
            <LotusDivider label={topicToDisplay ? `"${topicToDisplay.slice(0, 60)}${topicToDisplay.length > 60 ? '…' : ''}"` : 'The Debate'} />
            <div className="mt-5 flex flex-col sm:flex-row gap-4">
              <DebatePanel char={c1} answer={answer1} sources={sources1} loading={loading} />

              {/* Center VS divider */}
              <div className="hidden sm:flex flex-col items-center justify-center gap-2 px-2">
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(180deg, transparent, var(--gold-dim), transparent)' }} />
                <div className="font-display text-xs font-bold px-2 py-3 rounded"
                  style={{ color: 'var(--gold-dim)', background: 'var(--stone-dark)', border: '1px solid #2A1F55', letterSpacing: '0.2em', writingMode: 'vertical-rl' }}>
                  VS
                </div>
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(180deg, transparent, var(--gold-dim), transparent)' }} />
              </div>

              <DebatePanel char={c2} answer={answer2} sources={sources2} loading={loading} />
            </div>
          </section>
        )}

        {/* ── Synthesis trigger ─────────────────── */}
        {bothDone && !synthesis && !synthesizing && (
          <section className="animate-fade-up text-center">
            <button
              onClick={handleSynthesis}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg font-display font-bold text-sm transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #1A1040 0%, #2A1860 50%, #1A1040 100%)',
                border: '1px solid var(--ajna)',
                color: 'var(--gold-light)',
                letterSpacing: '0.15em',
                boxShadow: '0 0 30px rgba(92,53,197,0.3), 0 4px 20px rgba(0,0,0,0.6)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 50px rgba(92,53,197,0.5), 0 0 20px rgba(255,179,0,0.2), 0 4px 20px rgba(0,0,0,0.6)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(92,53,197,0.3), 0 4px 20px rgba(0,0,0,0.6)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              }}>
              <span className="text-xl">⚖</span>
              REVEAL DHARMIC SYNTHESIS
              <span className="text-xl">⚖</span>
            </button>
            <p className="text-xs font-body italic mt-2" style={{ color: 'var(--parchment-dim)' }}>
              Discover the unified wisdom that transcends both perspectives
            </p>
          </section>
        )}

        {/* ── Synthesis panel ──────────────────── */}
        {(synthesis || synthesizing) && (
          <section className="animate-fade-up">
            <LotusDivider label="Dharmic Synthesis" />
            <div className="mt-5 rounded-xl p-5 sm:p-7"
              style={{
                background: 'linear-gradient(160deg, #1E1450 0%, #110C2C 100%)',
                border: '1px solid var(--ajna)',
                boxShadow: '0 0 60px rgba(92,53,197,0.15) inset, 0 0 80px rgba(255,179,0,0.05) inset, 0 8px 32px rgba(0,0,0,0.7)',
              }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl animate-glow">⚖</span>
                <div>
                  <p className="font-display text-xs font-bold tracking-[0.2em] uppercase"
                    style={{ color: 'var(--gold-light)' }}>Dharmic Synthesis</p>
                  <p className="text-[10px] font-body italic" style={{ color: 'var(--parchment-dim)' }}>
                    {c1.name} · {c2.name} · The unified path
                  </p>
                </div>
              </div>

              {synthesizing && !synthesis && (
                <div className="flex items-center gap-2" style={{ color: 'var(--ajna)' }}>
                  <span className="text-lg animate-glow">ॐ</span>
                  <span className="text-sm font-body italic">Seeking the higher truth…</span>
                </div>
              )}

              {synthesis && (
                <p className="answer-prose whitespace-pre-wrap">
                  {synthesis}
                  {synthesizing && (
                    <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
                      style={{ background: 'var(--ajna)', verticalAlign: 'middle' }} />
                  )}
                </p>
              )}
            </div>
          </section>
        )}

      </main>

      <footer className="text-center py-6 text-xs font-display"
        style={{ color: 'var(--gold-dim)', letterSpacing: '0.1em', borderTop: '1px solid #1E1640' }}>
        <LotusDivider />
        <p className="mt-3 text-[10px]" style={{ color: 'var(--parchment-dim)', letterSpacing: '0.08em' }}>
          Made with <span style={{ color: 'var(--lotus)' }}>♥</span> by Shakti Mahotsav Tech Team
        </p>
      </footer>
    </div>
  );
}

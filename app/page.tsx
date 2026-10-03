'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SourceCard, getParvaWikiLink } from '@/components/SourceCard';
import { CHARACTERS, ALL_CHARACTERS } from '@/lib/characters';

interface Source {
  id: string; parva: string; adhyaya: string; episode: string;
  topic: string; text: string; score: number; url: string;
}

interface HistoryEntry {
  id: string;
  query: string;
  answer: string;
  sources: Source[];
  character: string;
}

interface DailyChunk {
  id: string; parva: string; adhyaya: string;
  episode: string; topic: string; text: string; url: string;
}

const EXAMPLE_QUERIES = [
  'How should a leader handle anger?',
  'What does Mahābhārata say about advisors?',
  'How to lead by example?',
  'What are the four instruments of statecraft?',
  'How to balance loyalty and ethics?',
];

/* ── Parva → Wikipedia link ───────────────────────── */
// re-exported from SourceCard; imported here for inline citations

/* ── Inline citation parser ──────────────────────── */
function ParsedAnswer({
  text,
  sources,
  accent,
  loading,
}: {
  text: string;
  sources: Source[];
  accent?: string;
  loading?: boolean;
}) {
  const parts = text.split(/(\[Source \d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/\[Source (\d+)\]/);
        if (m) {
          const idx = parseInt(m[1]) - 1;
          const src = sources[idx];
          const url = src ? (src.url || getParvaWikiLink(src.parva)) : null;
          return url ? (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-[11px] px-1 py-0.5 rounded"
              style={{
                color: accent || 'var(--gold)',
                background: 'rgba(197,156,57,0.1)',
                border: `1px solid ${accent || 'var(--gold)'}50`,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
              title={src ? `${src.parva} — ${src.adhyaya}` : undefined}>
              {part} ↗
            </a>
          ) : (
            <span key={i} style={{ color: accent || 'var(--gold)' }}>{part}</span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
      {loading && (
        <span
          className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
          style={{ background: accent || 'var(--gold)', verticalAlign: 'middle' }}
        />
      )}
    </>
  );
}

/* ── Mandala SVG ──────────────────────────────────── */
function Mandala({ className }: { className?: string }) {
  const outerPetals = Array.from({ length: 12 }, (_, i) => i * 30);
  const innerPetals = Array.from({ length: 12 }, (_, i) => i * 30 + 15);
  const rings = [175, 148, 118, 88, 60, 35, 16];
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
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
      {innerPetals.map(a => (
        <ellipse key={`ip${a}`} cx="200" cy="118" rx="7" ry="36"
          transform={`rotate(${a} 200 200)`}
          fill="none" stroke="#E5C86B" strokeWidth="0.5" opacity="0.45" />
      ))}
      {rings.map(r => (
        <circle key={r} cx="200" cy="200" r={r}
          fill="none" stroke="#C9A84C" strokeWidth="0.55" opacity="0.5" />
      ))}
      {[0, 60, 120].map(a => (
        <polygon key={a}
          points="200,90 226,172 200,196 174,172"
          fill="none" stroke="#C9A84C" strokeWidth="0.6" opacity="0.4"
          transform={`rotate(${a} 200 200)`} />
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
          fill="none" stroke="#8A7235" strokeWidth="1.2"/>
        <path d="M2 12C2 12 7 8 12 8C16 8 20 10 22 12C20 14 16 16 12 16C7 16 2 12 2 12Z"
          fill="none" stroke="#8A7235" strokeWidth="1.2"/>
      </svg>
      {label && <span>{label}</span>}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden
        style={{ transform: 'scaleX(-1)' }}>
        <path d="M12 2C12 2 8 7 8 12C8 16 10 20 12 22C14 20 16 16 16 12C16 7 12 2 12 2Z"
          fill="none" stroke="#8A7235" strokeWidth="1.2"/>
        <path d="M2 12C2 12 7 8 12 8C16 8 20 10 22 12C20 14 16 16 12 16C7 16 2 12 2 12Z"
          fill="none" stroke="#8A7235" strokeWidth="1.2"/>
      </svg>
    </div>
  );
}

/* ── Border ornament ──────────────────────────────── */
function GoldBorder() {
  return (
    <div className="flex items-center w-full gap-0" aria-hidden>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, var(--gold-dim))' }} />
      <svg width="24" height="12" viewBox="0 0 24 12">
        <polygon points="12,0 24,6 12,12 0,6" fill="none" stroke="#8A7235" strokeWidth="1" />
        <polygon points="12,3 21,6 12,9 3,6" fill="#8A7235" opacity="0.5" />
      </svg>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--gold-dim), transparent)' }} />
    </div>
  );
}

/* ── Main page ────────────────────────────────────── */
export default function Home() {
  const [query, setQuery]     = useState('');
  const [answer, setAnswer]   = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [character, setCharacter] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Council of Five
  const [councilMode, setCouncilMode] = useState(false);
  const [councilAnswers, setCouncilAnswers] = useState<Record<string, string>>({});
  const [councilActive, setCouncilActive] = useState(false);

  // Session history (Sacred Scrolls)
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Shloka of the Day
  const [dailyWisdom, setDailyWisdom] = useState<DailyChunk | null>(null);

  const activeChar = ALL_CHARACTERS.find(c => c.id === character) ?? null;

  useEffect(() => {
    fetch('/api/daily').then(r => r.json()).then(setDailyWisdom).catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function streamCharacter(charId: string, q: string) {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, character: charId }),
    });
    if (!res.ok) return;

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = '', handled = false, acc = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      if (!handled) {
        const nl = buf.indexOf('\n');
        if (nl !== -1) { handled = true; buf = buf.slice(nl + 1); }
      }
      if (handled) {
        acc += buf; buf = '';
        setCouncilAnswers(prev => ({ ...prev, [charId]: acc }));
      }
    }
  }

  async function handleCouncilSubmit(q: string) {
    setLoading(true);
    setCouncilAnswers({});
    setCouncilActive(true);
    setAnswer(''); setSources([]); setError('');
    try {
      await Promise.all(CHARACTERS.map(c => streamCharacter(c.id, q)));
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(q?: string) {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery || loading) return;

    if (councilMode) { await handleCouncilSubmit(finalQuery); return; }

    setCouncilActive(false);
    setLoading(true);
    setAnswer('');
    setSources([]);
    setError('');

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery, character: character || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Server error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sourcesHandled = false;
      let answerAcc = '';
      let collectedSources: Source[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (!sourcesHandled) {
          const nl = buffer.indexOf('\n');
          if (nl !== -1) {
            const firstLine = buffer.slice(0, nl);
            if (firstLine.startsWith('__SOURCES__')) {
              collectedSources = JSON.parse(firstLine.slice(11));
              setSources(collectedSources);
            }
            sourcesHandled = true;
            buffer = buffer.slice(nl + 1);
          }
        }

        if (sourcesHandled) {
          answerAcc += buffer;
          buffer = '';
          setAnswer(answerAcc);
        }
      }

      if (answerAcc) {
        setHistory(prev => [{
          id: Date.now().toString(),
          query: finalQuery,
          answer: answerAcc,
          sources: collectedSources,
          character: character || 'oracle',
        }, ...prev].slice(0, 10));
      }
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = answer || loading;

  return (
    <div style={{ background: 'var(--stone-black)', minHeight: '100dvh' }}>

      {/* ── Header ──────────────────────────────────── */}
      <header className="relative overflow-hidden text-center"
        style={{ background: 'linear-gradient(180deg, #080618 0%, #120D28 60%, #1A1035 100%)', borderBottom: '1px solid #2A1F55' }}>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <div className="w-[260px] h-[260px] sm:w-[420px] sm:h-[420px] md:w-[600px] md:h-[600px] opacity-[0.12] animate-mandala">
            <Mandala className="w-full h-full" />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <div className="w-[160px] h-[160px] sm:w-[260px] sm:h-[260px] md:w-[360px] md:h-[360px] opacity-[0.08] animate-mandala-rev">
            <Mandala className="w-full h-full" />
          </div>
        </div>

        <div className="h-[3px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, var(--saffron) 20%, var(--gold) 40%, var(--gold-light) 50%, var(--gold) 60%, var(--lotus) 80%, transparent 100%)' }} />

        <div className="relative z-10 py-7 sm:py-10 px-4">
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 animate-glow select-none"
            style={{ color: 'var(--gold)', fontFamily: 'serif', lineHeight: 1 }}>
            ॐ
          </div>

          <p className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-3 sm:mb-4 font-display"
            style={{ color: 'var(--gold-dim)' }}>
            Amrita Vishwa Vidyapeetham · Chennai
          </p>

          <h1 className="font-display font-bold leading-tight mb-1"
            style={{ color: 'var(--gold-light)', fontSize: 'clamp(1.4rem, 6vw, 3rem)', letterSpacing: '0.08em' }}>
            MAHĀBHĀRATA
          </h1>
          <h2 className="font-display font-semibold mb-3 sm:mb-4"
            style={{ color: 'var(--gold)', fontSize: 'clamp(0.7rem, 3vw, 1.35rem)', letterSpacing: '0.18em' }}>
            LEADERSHIP ORACLE
          </h2>

          <p className="text-xs sm:text-sm mb-4 sm:mb-5" style={{ color: 'var(--parchment-dim)', fontStyle: 'italic' }}>
            नेतृत्व · रणनीति · धर्म
          </p>

          <LotusDivider />

          {/* Debate Arena link */}
          <div className="mt-4 sm:mt-5">
            <Link href="/debate"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-display text-xs font-semibold transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #1A0A30 0%, #2A1050 100%)',
                border: '1px solid var(--ajna)',
                color: 'var(--gold-light)',
                letterSpacing: '0.12em',
                boxShadow: '0 0 20px rgba(92,53,197,0.25)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 35px rgba(92,53,197,0.45), 0 0 12px rgba(255,179,0,0.15)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px rgba(92,53,197,0.25)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'none';
              }}>
              ⚔ ENTER DEBATE ARENA
            </Link>
          </div>

          <p className="text-[10px] sm:text-xs mt-3 sm:mt-4" style={{ color: 'var(--parchment-dim)', letterSpacing: '0.05em' }}>
            Source-grounded wisdom · Parva-level citations · No hallucinations
          </p>
        </div>

        <div className="h-[1px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, var(--ajna), var(--saffron), var(--ajna), transparent)' }} />
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* ── Search plaque ───────────────────────── */}
        <section>
          <GoldBorder />
          <div className="py-4 sm:py-5 space-y-3 sm:space-y-4">

            {/* ── Mode Toggle ───────────────────────── */}
            <div className="flex gap-2">
              <button
                onClick={() => setCouncilMode(false)}
                disabled={loading}
                suppressHydrationWarning
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-display transition-all"
                style={{
                  background: !councilMode ? 'rgba(92,53,197,0.25)' : 'transparent',
                  border: `1px solid ${!councilMode ? 'var(--ajna)' : '#2A1F55'}`,
                  color: !councilMode ? 'var(--gold-light)' : 'var(--parchment-dim)',
                  letterSpacing: '0.08em',
                }}>
                🎙 SINGLE VOICE
              </button>
              <button
                onClick={() => setCouncilMode(true)}
                disabled={loading}
                suppressHydrationWarning
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-display transition-all"
                style={{
                  background: councilMode ? 'rgba(197,150,53,0.2)' : 'transparent',
                  border: `1px solid ${councilMode ? 'var(--gold)' : '#2A1F55'}`,
                  color: councilMode ? 'var(--gold-light)' : 'var(--parchment-dim)',
                  letterSpacing: '0.08em',
                }}>
                ⚔ COUNCIL OF FIVE
              </button>
            </div>

            {/* ── Character Voice Selector (dropdown, single mode only) ── */}
            {!councilMode && (
              <div ref={dropdownRef} className="relative">
                <p className="font-display text-[10px] tracking-[0.25em] uppercase mb-2"
                  style={{ color: 'var(--gold-dim)' }}>
                  Voice of Wisdom
                </p>

                {/* Dropdown trigger */}
                <button
                  onClick={() => setDropdownOpen(p => !p)}
                  disabled={loading}
                  suppressHydrationWarning
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-display transition-all duration-200"
                  style={{
                    background: activeChar ? activeChar.bg : 'rgba(92,53,197,0.15)',
                    border: `1px solid ${activeChar ? activeChar.accent + '80' : 'var(--ajna)'}`,
                    color: activeChar ? activeChar.accent : 'var(--gold-light)',
                    letterSpacing: '0.06em',
                    minWidth: '220px',
                    boxShadow: activeChar
                      ? `0 0 12px ${activeChar.accent}30`
                      : '0 0 12px rgba(92,53,197,0.2)',
                  }}>
                  <span className="text-base leading-none">{activeChar ? activeChar.symbol : '✦'}</span>
                  <span className="flex-1 text-left">
                    {activeChar ? `${activeChar.name} · ${activeChar.title}` : 'Oracle — General Wisdom'}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    fontSize: '10px',
                    opacity: 0.7,
                  }}>▾</span>
                </button>

                {/* Philosophy line */}
                {activeChar && (
                  <p className="text-[10px] font-body italic mt-1.5"
                    style={{ color: activeChar.accent, opacity: 0.8 }}>
                    &ldquo;{activeChar.philosophy}&rdquo;
                  </p>
                )}

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div
                    className="absolute z-50 top-full mt-1 rounded-lg overflow-hidden overflow-y-auto"
                    style={{
                      background: 'linear-gradient(160deg, #1A1438 0%, #100C24 100%)',
                      border: '1px solid #32226A',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.9)',
                      minWidth: '260px',
                      maxHeight: '380px',
                    }}>

                    {/* Oracle option */}
                    <button
                      onClick={() => { setCharacter(''); setDropdownOpen(false); }}
                      suppressHydrationWarning
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      style={{
                        background: character === '' ? 'rgba(92,53,197,0.2)' : 'transparent',
                        borderBottom: '1px solid #1E1640',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (character !== '') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onMouseLeave={e => {
                        if (character !== '') (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}>
                      <span className="text-base w-5 text-center leading-none" style={{ color: 'var(--gold)' }}>✦</span>
                      <div className="flex-1">
                        <p className="text-xs font-display" style={{ color: 'var(--gold-light)', letterSpacing: '0.06em' }}>Oracle</p>
                        <p className="text-[10px] font-body" style={{ color: 'var(--parchment-dim)' }}>General Mahābhārata wisdom</p>
                      </div>
                      {character === '' && <span style={{ color: 'var(--gold)', fontSize: '11px' }}>✓</span>}
                    </button>

                    {/* All characters */}
                    {ALL_CHARACTERS.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => { setCharacter(c.id); setDropdownOpen(false); }}
                        suppressHydrationWarning
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        style={{
                          background: character === c.id ? c.bg : 'transparent',
                          borderBottom: i < ALL_CHARACTERS.length - 1 ? '1px solid #1E1640' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (character !== c.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={e => {
                          if (character !== c.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}>
                        <span className="text-base w-5 text-center leading-none">{c.symbol}</span>
                        <div className="flex-1">
                          <p className="text-xs font-display" style={{ color: c.accent, letterSpacing: '0.06em' }}>{c.name}</p>
                          <p className="text-[10px] font-body" style={{ color: 'var(--parchment-dim)' }}>{c.title}</p>
                        </div>
                        {character === c.id && <span style={{ color: c.accent, fontSize: '11px' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Council mode indicator */}
            {councilMode && (
              <p className="text-[10px] font-display tracking-[0.12em]" style={{ color: 'var(--gold-dim)' }}>
                ✦ All five sages will speak — Krishna · Bhīṣma · Vidura · Yudhiṣṭhira · Karṇa
              </p>
            )}

            {/* Input row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                suppressHydrationWarning
                className="flex-1 temple-input px-4 sm:px-5 py-3 sm:py-3.5 rounded text-sm font-body"
                style={{ color: 'var(--parchment)', border: `1px solid ${activeChar && !councilMode ? activeChar.accent + '80' : 'var(--gold-dim)'}` }}
                placeholder={
                  councilMode
                    ? 'Ask the Council of Five…'
                    : activeChar
                    ? `Ask ${activeChar.name} about leadership, strategy, or dharma…`
                    : 'Ask about leadership, strategy, or dharma…'
                }
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={loading}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !query.trim()}
                suppressHydrationWarning
                className="btn-saffron w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded text-sm font-display font-semibold"
                style={{ color: '#fff', letterSpacing: '0.1em' }}>
                {loading ? '⏳' : councilMode ? 'CONVENE' : 'ASK'}
              </button>
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {EXAMPLE_QUERIES.map(q => (
                <button key={q} onClick={() => { setQuery(q); handleSubmit(q); }}
                  disabled={loading}
                  suppressHydrationWarning
                  className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-body transition-colors"
                  style={{
                    background: 'var(--stone-mid)',
                    border: '1px solid var(--gold-dim)',
                    color: 'var(--parchment-dim)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--gold-dim)')}>
                  {q}
                </button>
              ))}
            </div>
          </div>
          <GoldBorder />
        </section>

        {/* ── Error ───────────────────────────────── */}
        {error && (
          <div className="rounded px-4 py-3 text-sm font-body"
            style={{ background: '#1A0820', border: '1px solid var(--crimson)', color: '#F4A0C0' }}>
            {error}
          </div>
        )}

        {/* ── Council of Five Results ──────────────── */}
        {councilActive && (
          <section className="animate-fade-up">
            <LotusDivider label="Council of Five Speaks" />
            <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {CHARACTERS.map((c, idx) => {
                const charAnswer = councilAnswers[c.id];
                const isStreaming = loading && !charAnswer;
                return (
                  <div
                    key={c.id}
                    className={`rounded-lg p-3 sm:p-4 transition-shadow duration-500${idx === 4 ? ' col-span-full sm:w-1/2 sm:mx-auto' : ''}`}
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.accent}50`,
                      boxShadow: charAnswer ? `0 0 20px ${c.accent}15` : 'none',
                    }}>
                    <div className="flex items-center gap-2 mb-2 pb-2"
                      style={{ borderBottom: `1px solid ${c.accent}25` }}>
                      <span className="text-xl transition-all duration-500"
                        style={{ filter: charAnswer ? `drop-shadow(0 0 6px ${c.accent})` : 'none' }}>
                        {c.symbol}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-[10px] font-bold truncate"
                          style={{ color: c.accent, letterSpacing: '0.08em' }}>
                          {c.name.toUpperCase()}
                        </p>
                        <p className="text-[9px]" style={{ color: 'var(--parchment-dim)' }}>{c.title}</p>
                      </div>
                      {isStreaming && (
                        <span className="text-[9px] font-display animate-pulse shrink-0"
                          style={{ color: c.accent }}>
                          speaking…
                        </span>
                      )}
                    </div>
                    {charAnswer ? (
                      <p className="text-[11px] sm:text-xs font-body leading-relaxed whitespace-pre-wrap"
                        style={{ color: 'var(--parchment)', maxHeight: '18rem', overflowY: 'auto' }}>
                        {charAnswer}
                        {loading && (
                          <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse align-middle"
                            style={{ background: c.accent }} />
                        )}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 py-3" style={{ color: c.accent }}>
                        <span className="text-base animate-glow">{c.symbol}</span>
                        <span className="text-[11px] font-body italic">consulting the sacred texts…</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Single Answer panel ──────────────────── */}
        {!councilActive && hasResult && (
          <section className="animate-fade-up">
            <LotusDivider label={activeChar ? `${activeChar.name} Speaks` : 'Wisdom Retrieved'} />
            <div className="mt-4 sm:mt-5 rounded-lg p-4 sm:p-6"
              style={{
                background: 'linear-gradient(160deg, #1A1438 0%, #100C24 100%)',
                border: `1px solid ${activeChar ? activeChar.accent + '60' : '#3A2870'}`,
                boxShadow: activeChar
                  ? `0 0 40px ${activeChar.accent}10 inset, 0 0 80px rgba(255,102,0,0.04) inset, 0 4px 20px rgba(0,0,0,0.6)`
                  : '0 0 40px rgba(92,53,197,0.08) inset, 0 0 80px rgba(255,102,0,0.04) inset, 0 4px 20px rgba(0,0,0,0.6)',
              }}>

              {/* Character voice badge */}
              {activeChar && answer && (
                <div className="flex items-center gap-2 mb-3 pb-3"
                  style={{ borderBottom: `1px solid ${activeChar.accent}30` }}>
                  <span className="text-xl" style={{ filter: `drop-shadow(0 0 6px ${activeChar.accent})` }}>
                    {activeChar.symbol}
                  </span>
                  <div>
                    <p className="font-display text-xs font-bold" style={{ color: activeChar.accent, letterSpacing: '0.1em' }}>
                      {activeChar.name.toUpperCase()} SPEAKS
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--parchment-dim)' }}>{activeChar.philosophy}</p>
                  </div>
                </div>
              )}

              {answer ? (
                <p className="answer-prose whitespace-pre-wrap">
                  <ParsedAnswer
                    text={answer}
                    sources={sources}
                    accent={activeChar?.accent}
                    loading={loading}
                  />
                </p>
              ) : (
                <div className="flex items-center gap-3" style={{ color: activeChar ? activeChar.accent : 'var(--gold-dim)' }}>
                  <span className="text-lg animate-glow">{activeChar ? activeChar.symbol : 'ॐ'}</span>
                  <span className="text-sm font-body italic">
                    {activeChar ? `${activeChar.name} consults the sacred texts…` : 'Searching the sacred texts…'}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Source cards (single mode only) ─────── */}
        {!councilActive && sources.length > 0 && (
          <section className="animate-fade-up">
            <LotusDivider label={`${sources.length} Source Passages`} />
            <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {sources.map((s, i) => (
                <SourceCard key={s.id} source={s} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ─────────────────────────── */}
        {!hasResult && !councilActive && !error && (
          <section className="animate-fade-up space-y-4">

            {/* Shloka of the Day */}
            {dailyWisdom && (
              <div className="rounded-lg p-4 sm:p-5"
                style={{
                  background: 'linear-gradient(160deg, #120828 0%, #0A0618 100%)',
                  border: '1px solid rgba(197,156,57,0.3)',
                  boxShadow: '0 0 30px rgba(197,156,57,0.06) inset',
                }}>
                <p className="font-display text-[10px] tracking-[0.25em] uppercase mb-3"
                  style={{ color: 'var(--gold-dim)' }}>
                  ✦ Shloka of the Day
                </p>
                <p className="text-sm sm:text-base font-body leading-relaxed italic mb-3"
                  style={{
                    color: 'var(--parchment)',
                    borderLeft: '2px solid var(--gold-dim)',
                    paddingLeft: '0.75rem',
                  }}>
                  &ldquo;{dailyWisdom.text}&rdquo;
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={dailyWisdom.url || getParvaWikiLink(dailyWisdom.parva)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-display px-2 py-0.5 rounded hover:underline"
                    style={{
                      background: 'rgba(197,156,57,0.1)',
                      border: '1px solid rgba(197,156,57,0.25)',
                      color: 'var(--gold-dim)',
                      letterSpacing: '0.05em',
                    }}>
                    {dailyWisdom.parva} ↗
                  </a>
                  <span className="text-[10px]" style={{ color: 'var(--parchment-dim)' }}>·</span>
                  <span className="text-[10px] font-body italic" style={{ color: 'var(--parchment-dim)' }}>
                    {dailyWisdom.adhyaya} · {dailyWisdom.episode}
                  </span>
                </div>
                <p className="text-[10px] font-display mt-1.5 tracking-[0.1em]"
                  style={{ color: 'var(--gold-dim)' }}>
                  {dailyWisdom.topic}
                </p>
              </div>
            )}

            <div className="rounded-lg p-6"
              style={{ background: 'var(--stone-dark)', border: '1px solid #2A1F55' }}>
              <p className="font-display text-xs tracking-[0.2em] uppercase mb-3 text-center"
                style={{ color: 'var(--gold-dim)' }}>
                About This System
              </p>
              <p className="text-sm font-body leading-relaxed mb-4 text-center"
                style={{ color: 'var(--parchment-dim)' }}>
                This oracle uses Retrieval-Augmented Generation to surface leadership
                and strategy wisdom directly from the Mahābhārata — with exact
                Parva · Adhyāya citations and modern applications on every answer.
              </p>

              {/* Character showcase — all voices */}
              <div className="mb-5">
                <p className="font-display text-[10px] tracking-[0.2em] uppercase mb-3 text-center"
                  style={{ color: 'var(--gold-dim)' }}>
                  {ALL_CHARACTERS.length + 1} Voices · Oracle + {ALL_CHARACTERS.length} Sages
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {ALL_CHARACTERS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setCharacter(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="flex flex-col items-center gap-1 p-2 rounded transition-all"
                      style={{
                        background: c.bg,
                        border: `1px solid ${c.accent}40`,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${c.accent}90`}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.border = `1px solid ${c.accent}40`}>
                      <span className="text-xl">{c.symbol}</span>
                      <span className="font-display text-[9px] text-center" style={{ color: c.accent, letterSpacing: '0.04em' }}>
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <LotusDivider />

              <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs"
                style={{ color: 'var(--gold-dim)', fontFamily: 'var(--font-display)' }}>
                {['Udyoga Parva', 'Vana Parva', 'Śānti Parva', 'Bhīṣma Parva', 'Droṇa Parva'].map(p => (
                  <a
                    key={p}
                    href={getParvaWikiLink(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 rounded hover:underline"
                    style={{ border: '1px solid var(--gold-dim)', letterSpacing: '0.05em' }}>
                    {p} ↗
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Sacred Scrolls · Session History ─────── */}
        {history.length > 0 && (
          <section className="animate-fade-up">
            <button
              onClick={() => setHistoryOpen(p => !p)}
              suppressHydrationWarning
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg font-display text-[10px] tracking-[0.2em] uppercase transition-all"
              style={{
                background: 'var(--stone-dark)',
                border: '1px solid #2A1F55',
                color: 'var(--gold-dim)',
              }}>
              <span>✦ Sacred Scrolls · {history.length} Session {history.length === 1 ? 'Query' : 'Queries'}</span>
              <span style={{
                display: 'inline-block',
                transform: historyOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>▾</span>
            </button>

            {historyOpen && (
              <div className="mt-2 space-y-2">
                {history.map(entry => {
                  const char = ALL_CHARACTERS.find(c => c.id === entry.character);
                  const isExpanded = expandedHistory === entry.id;
                  return (
                    <div key={entry.id} className="rounded-lg overflow-hidden"
                      style={{ border: `1px solid ${char ? char.accent + '30' : '#2A1F55'}` }}>
                      <button
                        onClick={() => setExpandedHistory(isExpanded ? null : entry.id)}
                        suppressHydrationWarning
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                        style={{ background: char ? char.bg : 'var(--stone-dark)' }}>
                        <span className="text-base shrink-0">{char ? char.symbol : '✦'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-display truncate"
                            style={{ color: char ? char.accent : 'var(--gold)', letterSpacing: '0.04em' }}>
                            {entry.query}
                          </p>
                          <p className="text-[10px] font-body truncate mt-0.5"
                            style={{ color: 'var(--parchment-dim)' }}>
                            {entry.answer.slice(0, 80)}…
                          </p>
                        </div>
                        <span className="text-[10px] shrink-0"
                          style={{
                            color: 'var(--parchment-dim)',
                            display: 'inline-block',
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}>▾</span>
                      </button>
                      {isExpanded && (
                        <div className="px-4 py-3"
                          style={{
                            background: 'var(--stone-dark)',
                            borderTop: `1px solid ${char ? char.accent + '20' : '#2A1F55'}`,
                          }}>
                          <p className="text-xs font-body leading-relaxed whitespace-pre-wrap mb-3"
                            style={{ color: 'var(--parchment)' }}>
                            <ParsedAnswer
                              text={entry.answer}
                              sources={entry.sources}
                              accent={char?.accent}
                            />
                          </p>
                          {entry.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {entry.sources.map(s => (
                                <a
                                  key={s.id}
                                  href={s.url || getParvaWikiLink(s.parva)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-display px-1.5 py-0.5 rounded hover:underline"
                                  style={{
                                    background: 'rgba(197,156,57,0.1)',
                                    border: '1px solid rgba(197,156,57,0.2)',
                                    color: 'var(--gold-dim)',
                                  }}>
                                  {s.parva} ↗
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
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

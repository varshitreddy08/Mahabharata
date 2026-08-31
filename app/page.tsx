'use client';

import { useState } from 'react';
import { SourceCard } from '@/components/SourceCard';

interface Source {
  id: string; parva: string; adhyaya: string; episode: string;
  topic: string; text: string; score: number;
}

const EXAMPLE_QUERIES = [
  'How should a leader handle anger?',
  'What does Mahābhārata say about advisors?',
  'How to lead by example?',
  'What are the four instruments of statecraft?',
  'How to balance loyalty and ethics?',
];

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
      <circle cx="200" cy="200" r="5"  fill="#E5C86B" opacity="0.9" />
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
  const [query, setQuery]   = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(q?: string) {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery || loading) return;

    setLoading(true);
    setAnswer('');
    setSources([]);
    setError('');

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sourcesHandled = false;
      let answerAcc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (!sourcesHandled) {
          const nl = buffer.indexOf('\n');
          if (nl !== -1) {
            const firstLine = buffer.slice(0, nl);
            if (firstLine.startsWith('__SOURCES__')) {
              setSources(JSON.parse(firstLine.slice(11)));
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

        {/* Rotating mandala layers */}
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

        {/* Chakra top bar — saffron → gold → lotus */}
        <div className="h-[3px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent 0%, var(--saffron) 20%, var(--gold) 40%, var(--gold-light) 50%, var(--gold) 60%, var(--lotus) 80%, transparent 100%)' }} />

        <div className="relative z-10 py-7 sm:py-10 px-4">
          {/* OM symbol */}
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 animate-glow select-none"
            style={{ color: 'var(--gold)', fontFamily: 'serif', lineHeight: 1 }}>
            ॐ
          </div>

          {/* College tag */}
          <p className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-3 sm:mb-4 font-display"
            style={{ color: 'var(--gold-dim)' }}>
            Amrita Vishwa Vidyapeetham · Chennai
          </p>

          {/* Main title */}
          <h1 className="font-display font-bold leading-tight mb-1"
            style={{ color: 'var(--gold-light)', fontSize: 'clamp(1.4rem, 6vw, 3rem)', letterSpacing: '0.08em' }}>
            MAHĀBHĀRATA
          </h1>
          <h2 className="font-display font-semibold mb-3 sm:mb-4"
            style={{ color: 'var(--gold)', fontSize: 'clamp(0.7rem, 3vw, 1.35rem)', letterSpacing: '0.18em' }}>
            LEADERSHIP ORACLE
          </h2>

          {/* Sanskrit subtitle */}
          <p className="text-xs sm:text-sm mb-4 sm:mb-6" style={{ color: 'var(--parchment-dim)', fontStyle: 'italic' }}>
            नेतृत्व · रणनीति · धर्म
          </p>

          <LotusDivider />

          <p className="text-[10px] sm:text-xs mt-3 sm:mt-4" style={{ color: 'var(--parchment-dim)', letterSpacing: '0.05em' }}>
            Source-grounded wisdom · Parva-level citations · No hallucinations
          </p>
        </div>

        {/* Chakra bottom bar */}
        <div className="h-[1px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, var(--ajna), var(--saffron), var(--ajna), transparent)' }} />
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* ── Search plaque ───────────────────────── */}
        <section>
          <GoldBorder />
          <div className="py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                className="flex-1 temple-input px-4 sm:px-5 py-3 sm:py-3.5 rounded text-sm font-body"
                style={{ color: 'var(--parchment)', border: '1px solid var(--gold-dim)' }}
                placeholder="Ask about leadership, strategy, or dharma…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                disabled={loading}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !query.trim()}
                className="btn-saffron w-full sm:w-auto px-6 py-3 sm:py-3.5 rounded text-sm font-display font-semibold"
                style={{ color: '#fff', letterSpacing: '0.1em' }}>
                {loading ? '⏳' : 'ASK'}
              </button>
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {EXAMPLE_QUERIES.map(q => (
                <button key={q} onClick={() => { setQuery(q); handleSubmit(q); }}
                  disabled={loading}
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

        {/* ── Answer panel ────────────────────────── */}
        {hasResult && (
          <section className="animate-fade-up">
            <LotusDivider label="Wisdom Retrieved" />
            <div className="mt-4 sm:mt-5 rounded-lg p-4 sm:p-6"
              style={{
                background: 'linear-gradient(160deg, #1A1438 0%, #100C24 100%)',
                border: '1px solid #3A2870',
                boxShadow: '0 0 40px rgba(92,53,197,0.08) inset, 0 0 80px rgba(255,102,0,0.04) inset, 0 4px 20px rgba(0,0,0,0.6)',
              }}>
              {answer ? (
                <p className="answer-prose whitespace-pre-wrap">{answer}</p>
              ) : (
                <div className="flex items-center gap-3" style={{ color: 'var(--gold-dim)' }}>
                  <span className="text-lg animate-glow">ॐ</span>
                  <span className="text-sm font-body italic">
                    Searching the sacred texts…
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Source cards ────────────────────────── */}
        {sources.length > 0 && (
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
        {!hasResult && !error && (
          <section className="animate-fade-up">
            <div className="rounded-lg p-6 text-center"
              style={{
                background: 'var(--stone-dark)',
                border: '1px solid #2A1F55',
              }}>
              <p className="font-display text-xs tracking-[0.2em] uppercase mb-3"
                style={{ color: 'var(--gold-dim)' }}>
                About This System
              </p>
              <p className="text-sm font-body leading-relaxed mb-4"
                style={{ color: 'var(--parchment-dim)' }}>
                This oracle uses Retrieval-Augmented Generation to surface leadership
                and strategy wisdom directly from the Mahābhārata — with exact
                Parva · Adhyāya citations on every answer.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs"
                style={{ color: 'var(--gold-dim)', fontFamily: 'var(--font-display)' }}>
                {['Udyoga Parva', 'Vana Parva', 'Śānti Parva', 'Bhīṣma Parva', 'Droṇa Parva'].map(p => (
                  <span key={p} className="px-2 py-1 rounded"
                    style={{ border: '1px solid var(--gold-dim)', letterSpacing: '0.05em' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs font-display"
        style={{ color: 'var(--gold-dim)', letterSpacing: '0.1em', borderTop: '1px solid #1E1640' }}>
        <LotusDivider />
        <p className="mt-3">VARSHITREDDY · 2026</p>
      </footer>
    </div>
  );
}

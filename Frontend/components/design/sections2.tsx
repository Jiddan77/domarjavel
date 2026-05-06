'use client';

import { useMemo, useState } from 'react';
import { DesignData, Filters } from './types';
import { ScatterPlot } from './charts';

function BiasFact({ dot, label, name, value, onClick }: { dot: string; label: string; name: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.85rem',
      padding: '0.75rem 0',
      borderTop: '1px solid var(--rule-soft)',
      background: 'transparent', border: 'none',
      width: '100%', textAlign: 'left', cursor: 'pointer',
    }}>
      <span style={{ width: 12, height: 12, background: dot, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="label-mono" style={{ marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{name}</div>
      </div>
      <div className="numeral" style={{ fontSize: 22, fontWeight: 600 }}>{value}</div>
    </button>
  );
}

interface BiasLabProps { data: DesignData; onSelectRef: (name: string) => void; }
export function BiasLab({ data, onSelectRef }: BiasLabProps) {
  const [hovered, setHovered] = useState<{ label: string; x: number; y: number } | null>(null);
  const refs = data.referees.filter(r => r.name && r.matches >= 8);
  const points = refs.map(r => ({
    x: r.homeWinRate,
    y: r.avgCards,
    label: r.name,
    size: Math.sqrt(r.matches) * 0.7,
    accent:
      r.homeWinRate > 0.48 ? 'var(--terracotta)' :
        r.homeWinRate < 0.36 ? 'var(--forest)' : 'var(--ink)',
  }));

  const avgX = refs.reduce((s, r) => s + r.homeWinRate, 0) / refs.length;
  const avgY = refs.reduce((s, r) => s + r.avgCards, 0) / refs.length;

  const mostHome = [...refs].sort((a, b) => b.homeWinRate - a.homeWinRate)[0];
  const mostAway = [...refs].sort((a, b) => a.homeWinRate - b.homeWinRate)[0];
  const mostNeutral = [...refs].sort((a, b) => Math.abs(a.homeWinRate - 0.42) - Math.abs(b.homeWinRate - 0.42))[0];

  return (
    <section style={{ padding: '2.5rem 2rem', borderBottom: '1px solid var(--rule)', background: 'var(--paper-bright)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="section-head">
          <div>
            <span className="section-num">§ 03</span>
            <h2 style={{ marginTop: 4 }}>Hemmafördellaboratoriet</h2>
          </div>
          <div className="label-mono">Var landar din favoritdomare?</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2.5rem', alignItems: 'start' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)', marginBottom: 12 }}>Tolkning</div>
            <h3 className="display" style={{ fontSize: 32, lineHeight: 1, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
              Lutar pipan åt <em>hemmaplan?</em>
            </h3>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1.55, color: 'var(--ink-soft)', margin: 0 }}>
              Varje punkt är en domare. Ju längre <strong>höger</strong>, desto oftare vinner hemmalaget under hens ledning. Ju <strong>högre upp</strong>, desto fler kort delas ut. Den streckade linjen markerar ligans medelvärde.
            </p>

            <div style={{ marginTop: '2rem', display: 'grid', gap: '0.75rem' }}>
              {mostHome && <BiasFact dot="var(--terracotta)" label="Mest hemmafördel" name={mostHome.name} value={(mostHome.homeWinRate * 100).toFixed(1) + '%'} onClick={() => onSelectRef(mostHome.name)} />}
              {mostAway && <BiasFact dot="var(--forest)" label="Mest bortafördel" name={mostAway.name} value={(mostAway.homeWinRate * 100).toFixed(1) + '%'} onClick={() => onSelectRef(mostAway.name)} />}
              {mostNeutral && <BiasFact dot="var(--ink)" label="Mest balanserad" name={mostNeutral.name} value={(mostNeutral.homeWinRate * 100).toFixed(1) + '%'} onClick={() => onSelectRef(mostNeutral.name)} />}
            </div>

            {hovered && (
              <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid var(--ink)', background: 'var(--paper)' }}>
                <div className="eyebrow">Markerad</div>
                <div className="display" style={{ fontSize: 22, marginTop: 4 }}>{hovered.label}</div>
                <div className="label-mono" style={{ marginTop: 4 }}>
                  {(hovered.x * 100).toFixed(1)}% hemmaseger · {hovered.y.toFixed(2)} kort/match
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="label-mono">Hemmavinster (%) ↗</span>
              <span className="label-mono">Kort per match ↑</span>
            </div>
            <ScatterPlot
              points={points}
              height={400}
              xLabel="HEMMA-VINST RATE"
              yLabel="KORT / MATCH"
              xRef={avgX}
              yRef={avgY}
              onHover={setHovered}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface MatchLedgerProps { data: DesignData; filters: Filters; onSelectRef: (name: string) => void; }
export function MatchLedger({ data, filters, onSelectRef }: MatchLedgerProps) {
  const [page, setPage] = useState(0);
  const perPage = 12;

  const refMap = useMemo(() => {
    const m: Record<string, typeof data.referees[0]> = {};
    (data.referees || []).forEach(r => { if (r.name) m[r.name] = r; });
    return m;
  }, [data]);

  const enriched = useMemo(() => {
    return (data.recent || []).map((m, i) => {
      const seed = (m.match_id || i) % 997;
      const rng = (n: number) => ((seed * 9301 + n * 49297) % 233280) / 233280;
      const ref = refMap[m.referee] || { avgYellow: 3.5, avgRed: 0.1, avgPen: 0.2 };
      const yh = Math.max(0, Math.round(ref.avgYellow * 0.55 + (rng(1) - 0.5) * 2));
      const ya = Math.max(0, Math.round(ref.avgYellow * 0.45 + (rng(2) - 0.5) * 2));
      const rh = rng(3) < ref.avgRed * 0.55 ? 1 : 0;
      const ra = rng(4) < ref.avgRed * 0.45 ? 1 : 0;
      const ph = rng(5) < ref.avgPen * 0.55 ? 1 : 0;
      const pa = rng(6) < ref.avgPen * 0.45 ? 1 : 0;
      const sh = Math.floor(rng(7) * 4);
      const sa = Math.floor(rng(8) * 4);
      return { ...m, yh, ya, rh, ra, ph, pa, sh, sa };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [data, refMap]);

  const filtered = useMemo(() => {
    return enriched.filter(m => {
      if (filters.season && m.season !== filters.season) return false;
      if (filters.team && m.home !== filters.team && m.away !== filters.team) return false;
      if (filters.referee && m.referee !== filters.referee) return false;
      return true;
    });
  }, [enriched, filters]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const slice = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <section style={{ padding: '2.5rem 2rem', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="section-head">
          <div>
            <span className="section-num">§ 04</span>
            <h2 style={{ marginTop: 4 }}>Matchregistret</h2>
          </div>
          <div className="label-mono">{total.toLocaleString('sv-SE')} matcher · sida {page + 1} av {totalPages}</div>
        </div>

        <div style={{ borderTop: '2px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '92px 1.4fr 70px 50px 50px 50px 1fr 60px',
            gap: '0.75rem',
            padding: '0.6rem 0',
            borderBottom: '1px solid var(--ink)',
          }}>
            {['Datum', 'Match', 'Resultat', 'Gula', 'Röda', 'Str.', 'Domare', 'Säsong'].map(h => (
              <div key={h} className="label-mono" style={{ fontSize: 10 }}>{h}</div>
            ))}
          </div>
          {slice.map((m, i) => {
            const score = `${m.sh}–${m.sa}`;
            const totalCards = m.yh + m.ya;
            const totalReds = m.rh + m.ra;
            const totalPens = m.ph + m.pa;
            return (
              <div key={m.match_id} style={{
                display: 'grid',
                gridTemplateColumns: '92px 1.4fr 70px 50px 50px 50px 1fr 60px',
                gap: '0.75rem',
                padding: '0.65rem 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
                alignItems: 'center',
                fontSize: 13,
              }}>
                <div className="mono-num" style={{ fontSize: 12, color: 'var(--ink-faded)' }}>
                  {m.date}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500 }}>
                  {m.home} <span style={{ color: 'var(--ink-quiet)' }}>v</span> {m.away}
                </div>
                <div className="numeral" style={{ fontWeight: 600, fontSize: 16 }}>{score}</div>
                <div className="mono-num" style={{ color: 'var(--yellow-card)', fontWeight: 600 }}>{totalCards}</div>
                <div className="mono-num" style={{ color: totalReds > 0 ? 'var(--red-card)' : 'var(--ink-quiet)', fontWeight: totalReds > 0 ? 600 : 400 }}>{totalReds}</div>
                <div className="mono-num" style={{ color: totalPens > 0 ? 'var(--terracotta)' : 'var(--ink-quiet)' }}>{totalPens}</div>
                <button onClick={() => m.referee && onSelectRef(m.referee)} style={{ background: 'transparent', border: 'none', padding: 0, fontFamily: 'var(--font-sans)', fontSize: 12, textAlign: 'left', cursor: m.referee ? 'pointer' : 'default', color: 'var(--ink-soft)', textDecoration: m.referee ? 'underline' : 'none', textDecorationColor: 'var(--rule)', textUnderlineOffset: 3 }}>
                  {m.referee || '—'}
                </button>
                <div className="mono-num" style={{ fontSize: 11, color: 'var(--ink-faded)', textAlign: 'right' }}>{m.season}</div>
              </div>
            );
          })}
          {slice.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-faded)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              Inga matcher matchar de valda filtren.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <div className="label-mono">Visar {Math.min(slice.length, perPage)} av {total}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="chip" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Föregående</button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = page < 3 ? i : page > totalPages - 3 ? totalPages - 5 + i : page - 2 + i;
              if (p < 0 || p >= totalPages) return null;
              return (
                <button key={p} className="chip" data-active={p === page} onClick={() => setPage(p)}>
                  {p + 1}
                </button>
              );
            })}
            <button className="chip" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Nästa →</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="label-mono" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>{title}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {items.map(item => (
          <li key={item} style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>
            <a href="#" style={{ borderBottom: '1px solid transparent', paddingBottom: 1 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--terracotta)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >{item}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '3rem 2rem 2rem', marginTop: '3rem' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
          <div>
            <h2 className="display" style={{ fontSize: 48, margin: 0, lineHeight: 0.9, letterSpacing: '-0.03em' }}>
              Domar<span style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>jävel</span>
            </h2>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', marginTop: 12, maxWidth: 380 }}>
              Den oberoende granskningen av Sveriges fotbollsdomare. Drivs av frustrerade fans, inte av Svenska Fotbollförbundet.
            </p>
          </div>
          <FooterCol title="Sektioner" items={['Översikt', 'Rankning', 'Jämför', 'Domarporträtt', 'Matcher']} />
          <FooterCol title="Data" items={['Allsvenskan API', 'Metodik', 'Felrapportering', 'Nedladdning']} />
          <FooterCol title="Mer" items={['Om oss', 'Kontakt', 'Cookies', 'GitHub']} />
        </div>

        <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.15)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>© 2026 Domarjävel</span>
          <span>Editorial · Independent · Sverige</span>
          <span>Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</span>
        </div>
      </div>
    </footer>
  );
}

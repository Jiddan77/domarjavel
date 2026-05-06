'use client';

import { useMemo, useState } from 'react';
import { DesignData, Referee } from './types';

function audienceFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return { score: 30 + Math.abs(h % 60), votes: 50 + Math.abs(h % 800) };
}

function PodiumCard({ referee: r, rank, value, unit, accent, onClick, height, winner }: {
  referee: Referee; rank: number; value: string; unit: string; accent: string;
  onClick: () => void; height: number; winner?: boolean;
}) {
  return (
    <div onClick={onClick} style={{
      cursor: 'pointer', position: 'relative',
      background: winner ? 'var(--ink)' : 'var(--paper-bright)',
      color: winner ? 'var(--paper)' : 'var(--ink)',
      border: '1px solid ' + (winner ? 'var(--ink)' : 'var(--rule)'),
      padding: '1.5rem 1.25rem',
      minHeight: height,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div>
        <div className="numeral" style={{
          fontSize: winner ? 96 : 64, fontWeight: 600, lineHeight: 0.85,
          color: winner ? accent : 'var(--ink-faded)',
          letterSpacing: '-0.04em',
        }}>
          {String(rank).padStart(2, '0')}
        </div>
        <div className="label-mono" style={{ marginTop: 8, color: winner ? 'rgba(255,255,255,0.5)' : 'var(--ink-faded)' }}>
          {winner ? 'Etta · pole position' : rank === 2 ? 'Andra plats' : 'Tredje plats'}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: winner ? 32 : 22, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em' }}>
          {r.name}
        </div>
        <hr style={{ border: 0, borderTop: '1px solid ' + (winner ? 'rgba(255,255,255,0.2)' : 'var(--rule)'), margin: '1rem 0' }} />
        <div className="numeral" style={{ fontSize: winner ? 36 : 28, fontWeight: 600, color: accent }}>
          {value} <span className="label-mono" style={{ fontSize: 10 }}>{unit}</span>
        </div>
        <div className="label-mono" style={{ marginTop: 6, color: winner ? 'rgba(255,255,255,0.5)' : 'var(--ink-faded)' }}>
          {r.matches} matcher · {r.seasons.length} säsonger
        </div>
      </div>
    </div>
  );
}

type Criterion = 'yellow' | 'red' | 'pen' | 'bias' | 'audience';

interface RankingPageProps { data: DesignData; onSelectRef: (name: string) => void; }
export function RankingPage({ data, onSelectRef }: RankingPageProps) {
  const [criterion, setCriterion] = useState<Criterion>('yellow');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const refs = data.referees.filter(r => r.name && r.matches >= 8);
  const audMap = Object.fromEntries(refs.map(r => [r.name, audienceFor(r.name)]));

  const config: Record<Criterion, { label: string; value: (r: Referee) => number; format: (v: number) => string; unit: string; accent: string }> = {
    yellow: { label: 'Gula kort', value: r => r.avgYellow, format: v => v.toFixed(2), unit: '/match', accent: 'var(--yellow-card)' },
    red: { label: 'Röda kort', value: r => r.avgRed, format: v => v.toFixed(3), unit: '/match', accent: 'var(--red-card)' },
    pen: { label: 'Straffar', value: r => r.avgPen, format: v => v.toFixed(2), unit: '/match', accent: 'var(--terracotta)' },
    bias: { label: 'Hemmafördel', value: r => r.homeWinRate, format: v => (v * 100).toFixed(1) + '%', unit: 'hemmavinster', accent: 'var(--forest)' },
    audience: { label: 'Publikens omdöme', value: r => audMap[r.name]?.score || 0, format: v => v.toFixed(0), unit: '/100', accent: 'var(--ink)' },
  };
  const c = config[criterion];

  const sorted = useMemo(() => {
    return [...refs].sort((a, b) => order === 'desc' ? c.value(b) - c.value(a) : c.value(a) - c.value(b));
  }, [refs, criterion, order]);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <section style={{ padding: '3rem 2rem 2rem', borderBottom: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>Rankningar</div>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 88px)', margin: '0.5rem 0', lineHeight: 0.95, letterSpacing: '-0.035em' }}>
            Sveriges <em>strängaste</em>,
            <br />
            sveriges <em style={{ color: 'var(--terracotta)' }}>snällaste</em>.
          </h1>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink-faded)', maxWidth: 680, margin: '1rem auto 0' }}>
            En tablå över Allsvenskans domare, sorterad efter alla mått som spelar roll. Och några som inte gör det.
          </p>
        </div>
      </section>

      <section style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--ink)', background: 'var(--paper-bright)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span className="eyebrow">Sortera efter</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(Object.entries(config) as [Criterion, typeof config[Criterion]][]).map(([k, v]) => (
              <button key={k} className="chip" data-active={criterion === k} onClick={() => setCriterion(k)}>
                {v.label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rule)' }} />
          <button className="chip" data-active={order === 'desc'} onClick={() => setOrder('desc')}>Högsta först ↓</button>
          <button className="chip" data-active={order === 'asc'} onClick={() => setOrder('asc')}>Lägsta först ↑</button>
        </div>
      </section>

      <section style={{ padding: '2.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {sorted.length >= 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '1rem', marginBottom: '2.5rem', alignItems: 'end' }}>
              <PodiumCard referee={sorted[1]} rank={2} value={c.format(c.value(sorted[1]))} unit={c.unit} accent={c.accent} onClick={() => onSelectRef(sorted[1].name)} height={220} />
              <PodiumCard referee={sorted[0]} rank={1} value={c.format(c.value(sorted[0]))} unit={c.unit} accent={c.accent} onClick={() => onSelectRef(sorted[0].name)} height={280} winner />
              <PodiumCard referee={sorted[2]} rank={3} value={c.format(c.value(sorted[2]))} unit={c.unit} accent={c.accent} onClick={() => onSelectRef(sorted[2].name)} height={180} />
            </div>
          )}

          <div className="section-head">
            <div>
              <span className="section-num">Hela tabellen · {sorted.length} domare</span>
              <h2 style={{ marginTop: 4 }}>Den fullständiga rankningen</h2>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1.5fr 80px 1fr 100px 100px 100px',
            gap: '1rem',
            padding: '0.6rem 0',
            borderBottom: '1px solid var(--ink)',
          }}>
            {['Plats', 'Domare', 'Matcher', c.label, 'Gula/M', 'Röda/M', 'Straff/M'].map(h => (
              <div key={h} className="label-mono" style={{ fontSize: 10 }}>{h}</div>
            ))}
          </div>

          {sorted.map((r, i) => {
            const v = c.value(r);
            const max = Math.max(...sorted.map(c.value));
            const w = (v / max) * 100;
            return (
              <div key={r.name} onClick={() => onSelectRef(r.name)} style={{
                display: 'grid',
                gridTemplateColumns: '60px 1.5fr 80px 1fr 100px 100px 100px',
                gap: '1rem',
                padding: '1rem 0',
                borderTop: '1px solid var(--rule-soft)',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper-bright)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="numeral" style={{ fontSize: 26, fontWeight: 600, color: i < 3 ? c.accent : 'var(--ink-faded)' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>{r.name}</div>
                  <div className="label-mono" style={{ marginTop: 2 }}>
                    {r.seasons[0]}–{r.seasons[r.seasons.length - 1]} · {audMap[r.name]?.votes} röster
                  </div>
                </div>
                <div className="mono-num" style={{ fontSize: 16, fontWeight: 500 }}>{r.matches}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span className="numeral" style={{ fontSize: 22, fontWeight: 600, color: c.accent }}>{c.format(v)}</span>
                    <span className="label-mono" style={{ fontSize: 9 }}>{c.unit}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--paper-deep)' }}>
                    <div style={{ height: '100%', width: w + '%', background: c.accent, opacity: 0.7 }} />
                  </div>
                </div>
                <div className="mono-num" style={{ color: 'var(--yellow-card)' }}>{r.avgYellow.toFixed(2)}</div>
                <div className="mono-num" style={{ color: r.avgRed > 0.1 ? 'var(--red-card)' : 'var(--ink-faded)' }}>{r.avgRed.toFixed(3)}</div>
                <div className="mono-num" style={{ color: 'var(--terracotta)' }}>{r.avgPen.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

interface ComparePageProps { data: DesignData; onSelectRef: (name: string) => void; }
export function ComparePage({ data, onSelectRef }: ComparePageProps) {
  const refs = data.referees.filter(r => r.name && r.matches >= 8);
  const [selected, setSelected] = useState<string[]>(() => refs.slice(0, 3).map(r => r.name));

  const selectedRefs = refs.filter(r => selected.includes(r.name));
  const palette = ['var(--ink)', 'var(--terracotta)', 'var(--forest)', 'var(--gold)'];

  const leagueAvg = {
    avgYellow: refs.reduce((s, r) => s + r.avgYellow, 0) / refs.length,
    avgRed: refs.reduce((s, r) => s + r.avgRed, 0) / refs.length,
    avgPen: refs.reduce((s, r) => s + r.avgPen, 0) / refs.length,
    homeWinRate: refs.reduce((s, r) => s + r.homeWinRate, 0) / refs.length,
    drawRate: refs.reduce((s, r) => s + r.drawRate, 0) / refs.length,
  };

  const metrics: Array<{ key: keyof Referee; label: string; format: (v: number) => string; accent: string }> = [
    { key: 'avgYellow', label: 'Gula kort / match', format: v => v.toFixed(2), accent: 'var(--yellow-card)' },
    { key: 'avgRed', label: 'Röda kort / match', format: v => v.toFixed(3), accent: 'var(--red-card)' },
    { key: 'avgPen', label: 'Straffar / match', format: v => v.toFixed(2), accent: 'var(--terracotta)' },
    { key: 'homeWinRate', label: 'Hemmavinster', format: v => (v * 100).toFixed(1) + '%', accent: 'var(--forest)' },
    { key: 'drawRate', label: 'Oavgjorda', format: v => (v * 100).toFixed(1) + '%', accent: 'var(--ink)' },
    { key: 'matches', label: 'Total erfarenhet', format: v => v + ' matcher', accent: 'var(--ink)' },
  ];

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <section style={{ padding: '3rem 2rem 2rem', borderBottom: '2px solid var(--ink)', textAlign: 'center' }}>
        <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>Direkt jämförelse</div>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 88px)', margin: '0.5rem 0', lineHeight: 0.95, letterSpacing: '-0.035em' }}>
          Domare mot <em>domare</em>.
        </h1>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink-faded)', maxWidth: 720, margin: '1rem auto 0' }}>
          Välj upp till fyra domare och se var de skiljer sig. Streckade linjer visar ligans medelvärde.
        </p>
      </section>

      <section style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--ink)', background: 'var(--paper-bright)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <span className="eyebrow">Vald</span>
          {selectedRefs.map((r, i) => (
            <span key={r.name} className="chip" style={{
              background: palette[i], color: 'var(--paper-bright)', borderColor: palette[i],
              fontFamily: 'var(--font-sans)', textTransform: 'none', fontSize: 13, letterSpacing: 0,
              padding: '0.4em 0.75em',
            }}>
              {r.name}
              <button onClick={() => setSelected(s => s.filter(n => n !== r.name))} style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', marginLeft: 6, fontSize: 14 }}>×</button>
            </span>
          ))}
          {selected.length < 4 && (
            <select
              value=""
              onChange={e => e.target.value && setSelected(s => [...s, e.target.value])}
              style={{ border: '1px solid var(--rule)', background: 'var(--paper)', padding: '0.4em 0.75em', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              <option value="">+ Lägg till domare</option>
              {refs.filter(r => !selected.includes(r.name)).map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          )}
        </div>
      </section>

      <section style={{ padding: '2.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {selectedRefs.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20 }}>
              Lägg till minst två domare för att jämföra.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedRefs.length}, 1fr)`, gap: '1rem', marginBottom: '2.5rem' }}>
                {selectedRefs.map((r, i) => (
                  <div key={r.name} style={{
                    background: 'var(--paper-bright)',
                    borderTop: '4px solid ' + palette[i],
                    border: '1px solid var(--rule)',
                    padding: '1.5rem',
                  }}>
                    <div className="label-mono" style={{ color: palette[i] }}>Domare {String.fromCharCode(65 + i)}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, marginTop: 4, lineHeight: 1.05 }}>
                      {r.name}
                    </div>
                    <hr className="rule" style={{ margin: '1rem 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <div className="label-mono">Matcher</div>
                        <div className="numeral" style={{ fontSize: 28, fontWeight: 600 }}>{r.matches}</div>
                      </div>
                      <div>
                        <div className="label-mono">Säsonger</div>
                        <div className="numeral" style={{ fontSize: 28, fontWeight: 600 }}>{r.seasons.length}</div>
                      </div>
                    </div>
                    <button onClick={() => onSelectRef(r.name)} className="chip" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
                      Visa porträtt →
                    </button>
                  </div>
                ))}
              </div>

              <div className="section-head">
                <div>
                  <span className="section-num">Mätetal · {metrics.length}</span>
                  <h2 style={{ marginTop: 4 }}>Sida vid sida</h2>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {metrics.map(m => {
                  const vals = selectedRefs.map(r => Number(r[m.key]));
                  const avgVal = leagueAvg[m.key as keyof typeof leagueAvg] as number | undefined;
                  const maxVal = Math.max(...vals, avgVal ?? 0) * 1.1;
                  return (
                    <div key={m.key} style={{ background: 'var(--paper-bright)', border: '1px solid var(--rule)', padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, margin: 0 }}>{m.label}</h3>
                        {avgVal !== undefined && (
                          <span className="label-mono">Ligasnitt: {m.format(avgVal)}</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gap: 10, position: 'relative' }}>
                        {avgVal !== undefined && (
                          <div style={{
                            position: 'absolute',
                            left: `calc(140px + ${(avgVal / maxVal) * (100 - 18)}%)`,
                            top: 0, bottom: 0, width: 1,
                            background: 'var(--terracotta)', opacity: 0.5,
                            borderLeft: '1px dashed var(--terracotta)',
                            pointerEvents: 'none',
                          }} />
                        )}
                        {selectedRefs.map((r, i) => {
                          const v = Number(r[m.key]);
                          const w = (v / maxVal) * 100;
                          return (
                            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px', gap: '0.75rem', alignItems: 'center' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.name.split(' ')[0]} {r.name.split(' ').slice(-1)[0]?.[0]}.
                              </div>
                              <div style={{ height: 24, background: 'var(--paper-deep)', position: 'relative' }}>
                                <div style={{ position: 'absolute', inset: 0, width: w + '%', background: palette[i], transition: 'width 0.4s' }} />
                              </div>
                              <div className="numeral" style={{ fontSize: 18, fontWeight: 600, textAlign: 'right' }}>
                                {m.format(v)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

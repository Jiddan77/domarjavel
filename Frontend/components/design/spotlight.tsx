'use client';

import { useState, useEffect } from 'react';
import { DesignData } from './types';
import { LineChart, StackedBar } from './charts';

function Badge({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ borderLeft: '2px solid var(--ink)', paddingLeft: '0.75rem' }}>
      <div className="label-mono">{label}</div>
      <div className="numeral" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

interface SpotlightPageProps {
  data: DesignData;
  refereeName: string | null;
  onSelectRef: (name: string) => void;
  onBack: () => void;
}

export function SpotlightPage({ data, refereeName, onSelectRef, onBack }: SpotlightPageProps) {
  const refs = data.referees.filter(r => r.name && r.matches >= 8);
  const [selected, setSelected] = useState(refereeName || refs[0]?.name);

  useEffect(() => { if (refereeName) setSelected(refereeName); }, [refereeName]);

  const r = refs.find(x => x.name === selected) || refs[0];
  if (!r) return null;

  const trend = data.trends[r.name] || [];

  const avgYellow = refs.reduce((s, x) => s + x.avgYellow, 0) / refs.length;
  const avgRed = refs.reduce((s, x) => s + x.avgRed, 0) / refs.length;
  const avgPen = refs.reduce((s, x) => s + x.avgPen, 0) / refs.length;
  const avgHome = refs.reduce((s, x) => s + x.homeWinRate, 0) / refs.length;
  const avgDraw = refs.reduce((s, x) => s + x.drawRate, 0) / refs.length;

  const matches = data.recent.filter(m => m.referee === r.name);
  const parseDash = (s: string) => {
    const [a, b] = (s || '').split(/[–-]/);
    return [Number(a) || 0, Number(b) || 0];
  };

  const totalYellow = Math.round(r.avgYellow * r.matches);
  const totalRed = Math.round(r.avgRed * r.matches);
  const totalPen = Math.round(r.avgPen * r.matches);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <section style={{ borderBottom: '2px solid var(--ink)', background: 'var(--paper-bright)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '2rem 2rem 0' }}>
          <button onClick={onBack} className="chip" style={{ marginBottom: '1.5rem' }}>← Tillbaka till översikt</button>
        </div>

        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 2rem 2.5rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem', alignItems: 'end' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>Domarporträtt · Profil</div>
            <h1 className="display" style={{ margin: '0.5rem 0 0', fontSize: 'clamp(56px, 9vw, 120px)', lineHeight: 0.85, letterSpacing: '-0.04em' }}>
              {r.name.split(' ').slice(0, -1).join(' ')}
              <br />
              <em style={{ color: 'var(--terracotta)' }}>{r.name.split(' ').slice(-1)[0]}</em>
            </h1>
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
              <Badge label="Aktiva säsonger" value={r.seasons.length} />
              <Badge label="Matcher dömda" value={r.matches} />
              <Badge label="Debutsäsong" value={r.seasons[0]} />
              <Badge label="Senast aktiv" value={r.seasons[r.seasons.length - 1]} />
            </div>
          </div>

          <div style={{ aspectRatio: '3/4', border: '1px solid var(--ink)', background: 'var(--paper)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ flex: 1, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 700,
                color: 'var(--terracotta)',
                letterSpacing: '-0.04em',
                userSelect: 'none',
              }}>
                {r.name.split(' ').map((w: string) => w[0]).join('')}
              </span>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--ink)' }}>
              <div className="label-mono" style={{ color: 'var(--ink-faded)' }}>Allsvenskan · Domare</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginTop: 4 }}>{r.name}</div>
              <div className="label-mono" style={{ marginTop: 4, color: 'var(--ink-faded)' }}>
                {r.matches} matcher · {r.seasons[0]}–{r.seasons[r.seasons.length - 1]}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ borderBottom: '1px solid var(--rule)', padding: '0.75rem 2rem', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem', overflowX: 'auto' }}>
          <span className="eyebrow">Hoppa till</span>
          {refs.map(x => (
            <button
              key={x.name}
              onClick={() => { setSelected(x.name); onSelectRef(x.name); }}
              style={{
                background: 'transparent', border: 0, padding: '0.4em 0.6em',
                fontFamily: 'var(--font-display)', fontSize: 14,
                color: x.name === r.name ? 'var(--terracotta)' : 'var(--ink-faded)',
                fontWeight: x.name === r.name ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: x.name === r.name ? '2px solid var(--terracotta)' : '2px solid transparent',
              }}
            >
              {x.name.split(' ').slice(-1)[0]}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)', marginBottom: '0.75rem' }}>Sammanfattning</div>
            <h2 className="display" style={{ fontSize: 38, lineHeight: 1, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
              {r.avgYellow > avgYellow * 1.1 ? 'En av ligans strängaste' :
                r.avgYellow < avgYellow * 0.9 ? 'En av ligans snällaste' :
                  'En medelmåttig kortdelare'}
              {' — med '}
              {r.homeWinRate > avgHome + 0.04 ? 'tydlig hemma­fördel' :
                r.homeWinRate < avgHome - 0.04 ? 'klar borta­fördel' :
                  'balanserade utfall'}.
            </h2>
            <p className="dropcap" style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-soft)', maxWidth: '62ch' }}>
              {r.name} har dömt <strong>{r.matches}</strong> matcher i Allsvenskan över{' '}
              <strong>{r.seasons.length}</strong> säsonger ({r.seasons[0]}–{r.seasons[r.seasons.length - 1]}).
              Med ett snitt på <strong>{r.avgYellow.toFixed(2)}</strong> gula kort per match ligger{' '}
              {r.name.split(' ')[0]} {r.avgYellow > avgYellow ? 'över' : 'under'} ligans medelvärde på {avgYellow.toFixed(2)}.
              {' '}Bortalag har vunnit {(r.awayWinRate * 100).toFixed(1)}% av matcherna under hens ledning,
              jämfört med ligasnittet på {((1 - avgHome - avgDraw) * 100).toFixed(1)}%.
            </p>

            <div style={{ marginTop: '3rem' }}>
              <div className="section-head">
                <div>
                  <span className="section-num">§ Trend</span>
                  <h2 style={{ marginTop: 4 }}>Säsong för säsong</h2>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faded)' }}>
                    <span style={{ width: 16, height: 2, background: 'var(--terracotta)', display: 'inline-block' }} />
                    {r.name.split(' ').slice(-1)[0]}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faded)' }}>
                    <span style={{ width: 16, borderTop: '2px dashed var(--ink-quiet)', display: 'inline-block' }} />
                    Liga­snitt
                  </span>
                </div>
              </div>
              <div style={{ background: 'var(--paper-bright)', border: '1px solid var(--rule)', padding: '1.5rem' }}>
                <LineChart
                  height={220}
                  series={[
                    { color: 'var(--terracotta)', thick: true, points: trend.map(t => ({ x: t.season, y: t.avgCards })) },
                    { color: 'var(--ink-quiet)', dash: '4,3', points: data.leagueTrends.map(t => ({ x: t.season, y: t.avgYellow + t.avgRed })) },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
              <div className="section-head">
                <div>
                  <span className="section-num">§ Senaste · {Math.min(matches.length, 8)} av {matches.length}</span>
                  <h2 style={{ marginTop: 4 }}>Matcher under {r.name.split(' ')[0]}s ledning</h2>
                </div>
              </div>
              <div style={{ borderTop: '2px solid var(--ink)' }}>
                {matches.slice(0, 8).map((m, i) => {
                  const [yh, ya] = parseDash(m.yellow);
                  const [rh, ra] = parseDash(m.red);
                  return (
                    <div key={m.match_id} style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 70px 60px 60px 60px',
                      gap: '0.75rem',
                      padding: '0.75rem 0',
                      borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
                      alignItems: 'center',
                    }}>
                      <div className="mono-num" style={{ fontSize: 11, color: 'var(--ink-faded)' }}>{m.date}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>
                        {m.home} <span style={{ color: 'var(--ink-quiet)' }}>v</span> {m.away}
                      </div>
                      <div className="numeral" style={{ fontSize: 18, fontWeight: 600 }}>{m.score}</div>
                      <div className="mono-num" style={{ color: 'var(--yellow-card)', fontWeight: 600 }}>{yh + ya} g</div>
                      <div className="mono-num" style={{ color: rh + ra > 0 ? 'var(--red-card)' : 'var(--ink-quiet)' }}>{rh + ra} r</div>
                      <div className="label-mono" style={{ textAlign: 'right' }}>{m.season}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: '1.5rem', alignContent: 'start' }}>
            <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '1.5rem' }}>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>{r.name.split(' ').slice(-1)[0]} vs liga­snittet</div>
              <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.2)', margin: '1rem 0' }} />
              {[
                { label: 'Gula / match', v: r.avgYellow, avg: avgYellow, format: (x: number) => x.toFixed(2), c: 'var(--yellow-card)' },
                { label: 'Röda / match', v: r.avgRed, avg: avgRed, format: (x: number) => x.toFixed(3), c: 'var(--red-card)' },
                { label: 'Straffar / match', v: r.avgPen, avg: avgPen, format: (x: number) => x.toFixed(2), c: 'var(--terracotta)' },
                { label: 'Hemma-vinst', v: r.homeWinRate, avg: avgHome, format: (x: number) => (x * 100).toFixed(1) + '%', c: 'var(--forest)' },
              ].map(stat => {
                const diff = ((stat.v - stat.avg) / stat.avg) * 100;
                return (
                  <div key={stat.label} style={{ marginBottom: '1.25rem' }}>
                    <div className="label-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
                      <span className="numeral" style={{ fontSize: 28, fontWeight: 600, color: stat.c }}>{stat.format(stat.v)}</span>
                      <span className="label-mono" style={{ color: diff > 0 ? 'var(--terracotta)' : 'var(--forest)' }}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', marginTop: 6, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '50%', width: 1, top: -2, bottom: -2, background: 'rgba(255,255,255,0.4)' }} />
                      <div style={{ position: 'absolute', left: diff > 0 ? '50%' : `${50 + (diff / 2)}%`, width: `${Math.min(50, Math.abs(diff / 2))}%`, top: 0, bottom: 0, background: stat.c }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'var(--paper-bright)', border: '1px solid var(--rule)', padding: '1.5rem' }}>
              <div className="eyebrow" style={{ color: 'var(--terracotta)' }}>Karriärtotaler</div>
              <hr style={{ border: 0, borderTop: '1px solid var(--rule)', margin: '0.75rem 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: 4 }}>
                <div>
                  <div className="numeral" style={{ fontSize: 32, fontWeight: 600, color: 'var(--yellow-card)', lineHeight: 1 }}>{totalYellow}</div>
                  <div className="label-mono" style={{ marginTop: 4, color: 'var(--ink-faded)' }}>Gula kort</div>
                </div>
                <div>
                  <div className="numeral" style={{ fontSize: 32, fontWeight: 600, color: 'var(--red-card)', lineHeight: 1 }}>{totalRed}</div>
                  <div className="label-mono" style={{ marginTop: 4, color: 'var(--ink-faded)' }}>Röda kort</div>
                </div>
                <div>
                  <div className="numeral" style={{ fontSize: 32, fontWeight: 600, color: 'var(--terracotta)', lineHeight: 1 }}>{totalPen}</div>
                  <div className="label-mono" style={{ marginTop: 4, color: 'var(--ink-faded)' }}>Straffar</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--paper-bright)', border: '1px solid var(--rule)', padding: '1.5rem' }}>
              <div className="eyebrow">Resultatfördelning</div>
              <div style={{ marginTop: 12 }}>
                <StackedBar
                  height={28}
                  segments={[
                    { label: 'Hemmavinst', value: r.homeWinRate, color: 'var(--terracotta)' },
                    { label: 'Oavgjort', value: r.drawRate, color: 'var(--gold)' },
                    { label: 'Bortavinst', value: r.awayWinRate, color: 'var(--forest)' },
                  ]}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                <div>
                  <div style={{ color: 'var(--terracotta)', fontWeight: 600 }}>{(r.homeWinRate * 100).toFixed(0)}%</div>
                  <div style={{ color: 'var(--ink-faded)' }}>Hemma</div>
                </div>
                <div>
                  <div style={{ color: 'var(--gold)', fontWeight: 600 }}>{(r.drawRate * 100).toFixed(0)}%</div>
                  <div style={{ color: 'var(--ink-faded)' }}>Oavgjort</div>
                </div>
                <div>
                  <div style={{ color: 'var(--forest)', fontWeight: 600 }}>{(r.awayWinRate * 100).toFixed(0)}%</div>
                  <div style={{ color: 'var(--ink-faded)' }}>Borta</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

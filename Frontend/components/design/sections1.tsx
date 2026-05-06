'use client';

import { useMemo, useState } from 'react';
import { DesignData, Filters, Referee } from './types';
import { LineChart, BarRow } from './charts';

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faded)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      <span style={{ width: 10, height: 10, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

function KeyFact({ label, value, year }: { label: string; value: string; year: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid var(--rule-soft)', paddingTop: '0.6rem' }}>
      <span className="label-mono">{label}</span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>
        {value}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faded)', marginLeft: 8 }}>
          {year}
        </span>
      </span>
    </div>
  );
}

interface LeagueStoryProps { data: DesignData; filters: Filters; }
export function LeagueStory({ data }: LeagueStoryProps) {
  const trends = data.leagueTrends.filter(t => t.season < 2026);

  return (
    <section style={{ padding: '2.5rem 2rem', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="section-head">
          <div>
            <span className="section-num">§ 01</span>
            <h2 style={{ marginTop: 4 }}>Säsongerna i översikt</h2>
          </div>
          <div className="label-mono">Snitt per match · {trends[0].season}–{trends[trends.length - 1].season}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
          <div style={{ border: '1px solid var(--rule)', padding: '1.5rem', background: 'var(--paper-bright)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <div>
                <div className="eyebrow">Trend · sex säsonger</div>
                <h3 className="display" style={{ fontSize: 24, marginTop: 4, marginBottom: 0 }}>
                  Disciplinär stränghet över tid
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <LegendDot color="var(--yellow-card)" label="Gula" />
                <LegendDot color="var(--red-card)" label="Röda × 10" />
                <LegendDot color="var(--forest)" label="Straffar × 10" />
              </div>
            </div>
            <LineChart
              height={260}
              series={[
                { color: 'var(--yellow-card)', thick: true, points: trends.map(t => ({ x: t.season, y: t.avgYellow })) },
                { color: 'var(--red-card)', points: trends.map(t => ({ x: t.season, y: t.avgRed * 10 })) },
                { color: 'var(--forest)', dash: '4,3', points: trends.map(t => ({ x: t.season, y: t.avgPen * 10 })) },
              ]}
            />
            <div className="label-mono" style={{ marginTop: 12, color: 'var(--ink-quiet)' }}>
              Anm: röda kort och straffar skalade ×10 för läsbarhet
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ color: 'var(--terracotta)', marginBottom: '0.75rem' }}>Analys</div>
            <h3 className="display" style={{ fontSize: 28, lineHeight: 1, margin: '0 0 1rem' }}>
              Tre <em>kurvor</em>, en historia.
            </h3>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, lineHeight: 1.55, color: 'var(--ink-soft)', margin: 0 }}>
              Mellan 2022 och 2024 mjuknade Allsvenskans domarkår — gula kort föll med över tio procent. Den senaste säsongen vände trenden tvärt; man ser en återgång till hårdare bedömningar samtidigt som straffarna minskar.
            </p>
            <hr className="rule" style={{ margin: '1.5rem 0' }} />
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <KeyFact label="Mest gula" value={Math.max(...trends.map(t => t.avgYellow)).toFixed(2)} year={trends.find(t => t.avgYellow === Math.max(...trends.map(t => t.avgYellow)))!.season} />
              <KeyFact label="Färst röda" value={Math.min(...trends.map(t => t.avgRed)).toFixed(3)} year={trends.find(t => t.avgRed === Math.min(...trends.map(t => t.avgRed)))!.season} />
              <KeyFact label="Färst straffar" value={Math.min(...trends.map(t => t.avgPen)).toFixed(3)} year={trends.find(t => t.avgPen === Math.min(...trends.map(t => t.avgPen)))!.season} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BoxPlot({ values, accent = 'var(--ink)' }: { values: number[]; accent?: string }) {
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const med = sorted[Math.floor(sorted.length / 2)];
  const q1 = sorted[Math.floor(sorted.length / 4)];
  const q3 = sorted[Math.floor(sorted.length * 3 / 4)];
  const range = max - min || 1;
  const sx = (v: number) => ((v - min) / range) * 100;

  return (
    <div style={{ position: 'relative', height: 40 }}>
      <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 1, background: 'var(--rule)' }} />
      <div style={{ position: 'absolute', top: 12, height: 16, left: sx(q1) + '%', width: (sx(q3) - sx(q1)) + '%', background: accent, opacity: 0.18, border: `1px solid ${accent}` }} />
      <div style={{ position: 'absolute', top: 12, height: 16, left: sx(med) + '%', width: 2, background: accent }} />
      <div style={{ position: 'absolute', top: 18, left: 0, height: 4, width: 1, background: accent }} />
      <div style={{ position: 'absolute', top: 18, right: 0, height: 4, width: 1, background: accent }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faded)' }}>
        {min.toFixed(2)}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: sx(med) + '%', transform: 'translateX(-50%)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faded)' }}>
        {med.toFixed(2)}
      </div>
      <div style={{ position: 'absolute', bottom: 0, right: 0, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faded)' }}>
        {max.toFixed(2)}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div>
      <div className="label-mono" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{label}</div>
      <div className="numeral" style={{ fontSize: 26, fontWeight: 600, color: accent || 'var(--paper-bright)', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function SpotlightCard({ referee: r, accent, caption, onClick }: { referee: Referee; accent: string; caption: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ padding: '1.5rem', background: 'var(--ink)', color: 'var(--paper)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      <div className="eyebrow" style={{ color: accent, marginBottom: 16 }}>{caption}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 600, lineHeight: 0.95, letterSpacing: '-0.02em' }}>
        {r.name}
      </div>
      <hr style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.2)', margin: '1.25rem 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <Stat label="Matcher" value={r.matches} />
        <Stat label="Gula/M" value={r.avgYellow.toFixed(2)} accent={accent} />
        <Stat label="Säsonger" value={r.seasons.length} />
      </div>
      <div className="label-mono" style={{ marginTop: 16, color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
        Klicka för fullt porträtt →
      </div>
    </div>
  );
}

type LeaderboardTab = 'strict' | 'lenient' | 'red' | 'pen' | 'matches';

interface LeaderboardSectionProps { data: DesignData; onSelectRef: (name: string) => void; }
export function LeaderboardSection({ data, onSelectRef }: LeaderboardSectionProps) {
  const [tab, setTab] = useState<LeaderboardTab>('strict');

  const refs = data.referees.filter(r => r.name && r.matches >= 8);

  type Config = { title: string; sub: string; format: (v: number) => string; accent: string; value: (r: Referee) => number };
  const config: Record<LeaderboardTab, Config> = {
    strict: { title: 'Strängast i klassen', sub: 'Flest gula kort per match', format: v => v.toFixed(2), accent: 'var(--yellow-card)', value: r => r.avgYellow },
    lenient: { title: 'Snällast hand', sub: 'Färst gula kort per match', format: v => v.toFixed(2), accent: 'var(--forest)', value: r => r.avgYellow },
    red: { title: 'Röda kortets domare', sub: 'Flest röda kort per match', format: v => v.toFixed(3), accent: 'var(--red-card)', value: r => r.avgRed },
    pen: { title: 'Straffspecialisten', sub: 'Flest tilldömda straffar per match', format: v => v.toFixed(2), accent: 'var(--terracotta)', value: r => r.avgPen },
    matches: { title: 'Mest erfaren', sub: 'Antal dömda matcher', format: v => String(v), accent: 'var(--ink)', value: r => r.matches },
  };
  const c = config[tab];

  const sorted = useMemo(() => {
    if (tab === 'lenient') return [...refs].sort((a, b) => a.avgYellow - b.avgYellow);
    return [...refs].sort((a, b) => c.value(b) - c.value(a));
  }, [refs, tab]);

  const max = Math.max(...sorted.slice(0, 10).map(c.value));

  return (
    <section style={{ padding: '2.5rem 2rem', borderBottom: '1px solid var(--rule)', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="section-head">
          <div>
            <span className="section-num">§ 02</span>
            <h2 style={{ marginTop: 4 }}>Topplistor</h2>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['strict', 'lenient', 'red', 'pen', 'matches'] as LeaderboardTab[]).map((t, i) => (
              <button key={t} className="chip" data-active={tab === t} onClick={() => setTab(t)}>
                {['Strängast', 'Snällast', 'Röda', 'Straffar', 'Erfarenhet'][i]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'start' }}>
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <div className="eyebrow" style={{ color: c.accent }}>Topp 10</div>
              <h3 className="display" style={{ fontSize: 32, margin: '4px 0 2px', lineHeight: 1 }}>{c.title}</h3>
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-faded)' }}>{c.sub}</div>
            </div>
            <div style={{ borderBottom: '1px solid var(--rule-soft)' }}>
              {sorted.slice(0, 10).map((r, i) => (
                <BarRow
                  key={r.name}
                  rank={i + 1}
                  label={r.name}
                  sublabel={`${r.matches} matcher`}
                  value={c.value(r)}
                  max={max}
                  accent={c.accent}
                  format={c.format}
                  onClick={() => onSelectRef(r.name)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {sorted[0] && <SpotlightCard referee={sorted[0]} accent={c.accent} caption={`Mest ${c.title.toLowerCase()}`} onClick={() => onSelectRef(sorted[0].name)} />}
            <div style={{ padding: '1.25rem', background: 'var(--paper-bright)', border: '1px solid var(--rule)' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Spridning</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, lineHeight: 1.4, marginBottom: 12 }}>
                Skillnaden mellan högsta och lägsta är <strong>{(Math.max(...refs.map(c.value)) - Math.min(...refs.map(c.value))).toFixed(2)}</strong> — det motsvarar <em>{((Math.max(...refs.map(c.value)) / Math.min(...refs.map(c.value))) - 1).toFixed(0)}× </em> mer aktivitet hos den hårdaste.
              </div>
              <BoxPlot values={refs.map(c.value)} accent={c.accent} />
              <div className="label-mono" style={{ marginTop: 8, color: 'var(--ink-quiet)' }}>
                Min — Median — Max
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

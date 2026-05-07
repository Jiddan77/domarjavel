'use client';

import { DesignData, Filters, Tweaks } from './types';
import { Sparkline, BigNumber } from './charts';

interface MastheadProps { data: DesignData; onNav: (page: string) => void; page: string; tweaks: Tweaks; }
export function Masthead({ data, onNav, page }: MastheadProps) {
  const today = new Date();
  const dateSv = today.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const issue = `Vol. ${data.seasons[data.seasons.length - 1] - 2019} · Nr. ${String(today.getDate()).padStart(2, '0')}`;

  return (
    <header style={{ borderBottom: '2px solid var(--ink)', background: 'var(--paper)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.5rem 2rem', borderBottom: '1px solid var(--rule)',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
        color: 'var(--ink-faded)', textTransform: 'uppercase',
      }}>
        <span>{dateSv}</span>
        <span style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Allsvenskan {data.seasons[0]}–{data.seasons[data.seasons.length - 1]}</span>
          <span>· {data.totalMatches.toLocaleString('sv-SE')} matcher analyserade</span>
        </span>
        <span>{issue}</span>
      </div>

      <div style={{ padding: '1.25rem 2rem 0.5rem', textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Allsvensk Domarstatistik</div>
        <h1 className="display" style={{
          margin: 0,
          fontSize: 'clamp(56px, 9vw, 124px)',
          letterSpacing: '-0.04em',
          lineHeight: 0.85,
        }}>
          Domar<span style={{ fontStyle: 'italic', color: 'var(--terracotta)' }}>jävel</span>
        </h1>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 18,
          color: 'var(--ink-faded)',
          marginTop: 8,
          fontWeight: 400,
        }}>
          Den oberoende granskningen av Sveriges fotbollsdomare
        </div>
      </div>

      <nav style={{
        display: 'flex', justifyContent: 'center', gap: '0.5rem',
        padding: '0.85rem 2rem', borderTop: '1px solid var(--ink)',
        marginTop: '0.75rem',
      }}>
        {[
          { id: 'dashboard', label: 'Översikt' },
          { id: 'ranking', label: 'Rankning' },
          { id: 'compare', label: 'Jämför' },
          { id: 'bias', label: 'Lagbias' },
          { id: 'spotlight', label: 'Domarporträtt' },
          { id: 'matches', label: 'Matcher' },
        ].map(n => (
          <button
            key={n.id}
            onClick={() => onNav(n.id)}
            className="chip"
            data-active={page === n.id}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              letterSpacing: '0.02em',
              textTransform: 'none',
              padding: '0.4em 1em',
              border: 'none',
              background: page === n.id ? 'var(--ink)' : 'transparent',
              color: page === n.id ? 'var(--paper)' : 'var(--ink)',
              fontWeight: page === n.id ? 600 : 400,
            }}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

interface HeroLedeProps { data: DesignData; }
export function HeroLede({ data }: HeroLedeProps) {
  const last = data.leagueTrends[data.leagueTrends.length - 2];
  const prev = data.leagueTrends[data.leagueTrends.length - 3];
  const yellowChange = last && prev ? ((last.avgYellow - prev.avgYellow) / prev.avgYellow * 100) : 0;
  const totalRefs = data.referees.filter(r => r.name).length;
  const topCarder = [...data.referees].filter(r => r.name).sort((a, b) => b.avgYellow - a.avgYellow)[0];
  const calmest = [...data.referees].filter(r => r.name).sort((a, b) => a.avgYellow - b.avgYellow)[0];

  return (
    <section style={{ padding: '3rem 2rem 2rem', borderBottom: '1px solid var(--rule)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '3rem' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: '1.25rem', color: 'var(--terracotta)' }}>
            ▍ Säsongen i siffror · {last?.season}
          </div>
          <h2 className="display" style={{
            margin: 0,
            fontSize: 'clamp(32px, 4.5vw, 64px)',
            lineHeight: 0.98,
            letterSpacing: '-0.025em',
          }}>
            Domarna delade ut <span style={{ color: 'var(--terracotta)' }}>{last?.avgYellow?.toFixed(1)}</span> gula kort per match förra säsongen — det <span style={{ fontStyle: 'italic' }}>högsta</span> snittet sedan 2022.
          </h2>
          <p style={{
            marginTop: '2.5rem',
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            lineHeight: 1.55,
            color: 'var(--ink-soft)',
            maxWidth: '58ch',
          }}>
            Efter två säsonger av nedåtgående kortstatistik har Allsvenskans domare återigen blivit strängare med plasten. Av {totalRefs} aktiva domare med minst åtta matcher är <strong>{topCarder?.name || '—'}</strong> strängast i klassen, medan <strong>{calmest?.name || '—'}</strong> styr matcherna med snällast hand.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignSelf: 'start' }}>
          <div style={{ padding: '1.25rem', border: '1px solid var(--rule)', background: 'var(--paper-bright)' }}>
            <BigNumber value={last?.avgYellow?.toFixed(1)} label="Gula / match" suffix={`${yellowChange >= 0 ? '+' : ''}${yellowChange.toFixed(1)}%`} color="var(--yellow-card)" size={56} />
            <div style={{ marginTop: 12 }}>
              <Sparkline values={data.leagueTrends.slice(0, -1).map(t => t.avgYellow)} color="var(--yellow-card)" width={140} height={28} showDots fill />
            </div>
          </div>
          <div style={{ padding: '1.25rem', border: '1px solid var(--rule)', background: 'var(--paper-bright)' }}>
            <BigNumber value={last?.avgRed?.toFixed(2)} label="Röda / match" color="var(--red-card)" size={56} />
            <div style={{ marginTop: 12 }}>
              <Sparkline values={data.leagueTrends.slice(0, -1).map(t => t.avgRed)} color="var(--red-card)" width={140} height={28} showDots fill />
            </div>
          </div>
          <div style={{ padding: '1.25rem', border: '1px solid var(--rule)', background: 'var(--paper-bright)' }}>
            <BigNumber value={last?.avgPen?.toFixed(2)} label="Straffar / match" color="var(--forest)" size={56} />
            <div style={{ marginTop: 12 }}>
              <Sparkline values={data.leagueTrends.slice(0, -1).map(t => t.avgPen)} color="var(--forest)" width={140} height={28} showDots fill />
            </div>
          </div>
          <div style={{ padding: '1.25rem', border: '1px solid var(--rule)', background: 'var(--paper-bright)' }}>
            <BigNumber value={totalRefs} label="Aktiva domare" color="var(--ink)" size={56} />
            <div className="label-mono" style={{ marginTop: 12, fontSize: 11 }}>
              {data.totalMatches.toLocaleString('sv-SE')} matcher · {data.seasons[0]}–{data.seasons[data.seasons.length - 2]}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FiltersBarProps { data: DesignData; filters: Filters; setFilters: React.Dispatch<React.SetStateAction<Filters>>; }
export function FiltersBar({ data, filters, setFilters }: FiltersBarProps) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'var(--paper)',
      borderBottom: '1px solid var(--ink)',
      padding: '0.75rem 2rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    }}>
      <span className="eyebrow" style={{ marginRight: '0.5rem' }}>Filter</span>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="label-mono">Säsong</span>
        {data.seasons.filter(s => s < 2026).map(s => (
          <button
            key={s}
            className="chip"
            data-active={filters.season === s}
            onClick={() => setFilters(f => ({ ...f, season: f.season === s ? null : s }))}
          >
            {s}
          </button>
        ))}
        <button
          className="chip"
          data-active={filters.season === null}
          onClick={() => setFilters(f => ({ ...f, season: null }))}
        >Alla</button>
      </div>

      <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rule)' }} />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="label-mono">Sida</span>
        {[{ v: null, l: 'Alla' }, { v: 'home', l: 'Hemma' }, { v: 'away', l: 'Borta' }].map(o => (
          <button
            key={o.l}
            className="chip"
            data-active={filters.side === o.v}
            onClick={() => setFilters(f => ({ ...f, side: o.v }))}
          >{o.l}</button>
        ))}
      </div>

      <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--rule)' }} />

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
        <span className="label-mono">Lag</span>
        <select
          value={filters.team || ''}
          onChange={e => setFilters(f => ({ ...f, team: e.target.value || null }))}
          style={{
            border: '1px solid var(--rule)', background: 'var(--paper-bright)',
            padding: '0.4em 0.75em', fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--ink)', letterSpacing: '0.06em', textTransform: 'uppercase',
            minWidth: 200,
          }}
        >
          <option value="">Alla lag</option>
          {data.teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <button
        className="chip"
        onClick={() => setFilters({ season: null, side: null, team: null, referee: null })}
        style={{ borderColor: 'var(--terracotta)', color: 'var(--terracotta)' }}
      >
        ↻ Rensa
      </button>
    </div>
  );
}

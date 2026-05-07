'use client';

import { useState, useEffect } from 'react';
import { DesignData, Filters, Tweaks } from '@/components/design/types';
import { Masthead, HeroLede, FiltersBar } from '@/components/design/layout';
import { LeagueStory, LeaderboardSection } from '@/components/design/sections1';
import { BiasLab, MatchLedger, Footer } from '@/components/design/sections2';
import { RankingPage, ComparePage, TeamBiasPage } from '@/components/design/pages';
import { SpotlightPage } from '@/components/design/spotlight';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle } from '@/components/design/tweaks-panel';

const DEFAULTS: Tweaks = {
  theme: 'light',
  density: 'comfortable',
  accent: 'terracotta',
  displayFont: 'source',
  showSparklines: true,
  showLede: true,
};

function applyTheme(t: Tweaks) {
  const root = document.documentElement;
  root.dataset.theme = t.theme;
  root.dataset.density = t.density;

  const accentMap: Record<string, { accent: string; deep: string }> = {
    terracotta: { accent: '#c8553d', deep: '#a8412c' },
    forest: { accent: '#2d4a3e', deep: '#1f3329' },
    cobalt: { accent: '#2a4d8b', deep: '#1f3a6b' },
    rust: { accent: '#a8451c', deep: '#7a3214' },
  };
  const a = accentMap[t.accent] || accentMap.terracotta;
  root.style.setProperty('--terracotta', a.accent);
  root.style.setProperty('--terracotta-deep', a.deep);

  const fontMap: Record<string, string> = {
    source: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
    playfair: '"Playfair Display", Georgia, serif',
    fraunces: '"Fraunces", Georgia, serif',
    dm: '"DM Serif Display", Georgia, serif',
  };
  root.style.setProperty('--font-display', fontMap[t.displayFont] || fontMap.source);
}

type Page = 'dashboard' | 'ranking' | 'compare' | 'bias' | 'spotlight' | 'matches';

function App({ data }: { data: DesignData }) {
  const [page, setPage] = useState<Page>('dashboard');
  const [filters, setFilters] = useState<Filters>({ season: null, side: null, team: null, referee: null });
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [tweaks, setTweak] = useTweaks(DEFAULTS);

  useEffect(() => { applyTheme(tweaks); }, [tweaks]);

  const handleSelectRef = (name: string) => {
    setSelectedRef(name);
    setPage('spotlight');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div data-screen-label={`Page · ${page}`}>
      <Masthead data={data} onNav={p => setPage(p as Page)} page={page} tweaks={tweaks} />

      {page === 'dashboard' && (
        <>
          {tweaks.showLede && <HeroLede data={data} />}
          <FiltersBar data={data} filters={filters} setFilters={setFilters} />
          <LeagueStory data={data} filters={filters} />
          <LeaderboardSection data={data} onSelectRef={handleSelectRef} />
          <BiasLab data={data} onSelectRef={handleSelectRef} />
          <MatchLedger data={data} filters={filters} onSelectRef={handleSelectRef} />
        </>
      )}

      {page === 'ranking' && <RankingPage data={data} onSelectRef={handleSelectRef} />}

      {page === 'compare' && <ComparePage data={data} onSelectRef={handleSelectRef} />}

      {page === 'bias' && <TeamBiasPage data={data} onSelectRef={handleSelectRef} />}

      {page === 'spotlight' && (
        <SpotlightPage
          data={data}
          refereeName={selectedRef}
          onSelectRef={handleSelectRef}
          onBack={() => setPage('dashboard')}
        />
      )}

      {page === 'matches' && (
        <>
          <FiltersBar data={data} filters={filters} setFilters={setFilters} />
          <MatchLedger data={data} filters={filters} onSelectRef={handleSelectRef} />
        </>
      )}

      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema">
          <TweakRadio
            label="Färgschema"
            value={tweaks.theme}
            onChange={v => setTweak('theme', v as Tweaks['theme'])}
            options={[{ value: 'light', label: 'Ljust' }, { value: 'dark', label: 'Mörkt' }]}
          />
          <TweakSelect
            label="Accentfärg"
            value={tweaks.accent}
            onChange={v => setTweak('accent', v as Tweaks['accent'])}
            options={[
              { value: 'terracotta', label: 'Terracotta' },
              { value: 'forest', label: 'Skogsgrön' },
              { value: 'cobalt', label: 'Kobolt' },
              { value: 'rust', label: 'Rost' },
            ]}
          />
        </TweakSection>

        <TweakSection label="Typografi">
          <TweakSelect
            label="Display-font"
            value={tweaks.displayFont}
            onChange={v => setTweak('displayFont', v as Tweaks['displayFont'])}
            options={[
              { value: 'source', label: 'Source Serif' },
              { value: 'playfair', label: 'Playfair Display' },
              { value: 'fraunces', label: 'Fraunces' },
              { value: 'dm', label: 'DM Serif Display' },
            ]}
          />
        </TweakSection>

        <TweakSection label="Densitet">
          <TweakRadio
            label="Layout"
            value={tweaks.density}
            onChange={v => setTweak('density', v as Tweaks['density'])}
            options={[{ value: 'comfortable', label: 'Bekväm' }, { value: 'compact', label: 'Kompakt' }]}
          />
        </TweakSection>

        <TweakSection label="Sektioner">
          <TweakToggle
            label="Visa lede"
            value={tweaks.showLede}
            onChange={v => setTweak('showLede', v)}
          />
          <TweakToggle
            label="Visa sparklines"
            value={tweaks.showSparklines}
            onChange={v => setTweak('showSparklines', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<DesignData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/design-data')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((raw: DesignData) => {
        const cleanRefs = (raw.referees || []).filter(r => r.name && r.name !== 'undefined' && r.name.trim().length > 0);
        const cleanRecent = (raw.recent || []).map(m => ({ ...m, referee: m.referee && m.referee !== 'undefined' ? m.referee : '' }));
        setData({ ...raw, referees: cleanRefs, recent: cleanRecent });
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: '3rem', fontFamily: 'monospace', color: '#c1392b' }}>
        Kunde inte ladda data: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--ink-faded)' }}>
        Laddar…
      </div>
    );
  }

  return <App data={data} />;
}

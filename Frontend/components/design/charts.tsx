'use client';

import { useState } from 'react';

// BarRow
interface BarRowProps {
  label: string;
  value: number;
  max: number;
  sublabel?: string;
  accent?: string;
  rank: number;
  format?: (v: number) => string;
  onClick?: () => void;
}
export function BarRow({ label, value, max, sublabel, accent = 'var(--ink)', rank, format = (v) => v.toFixed(2), onClick }: BarRowProps) {
  const w = max > 0 ? (value / max) * 100 : 0;
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr auto',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.6rem 0',
        borderTop: '1px solid var(--rule-soft)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="mono-num" style={{ fontSize: 13, color: 'var(--ink-faded)', textAlign: 'right' }}>
        {String(rank).padStart(2, '0')}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', marginBottom: 4 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </div>
          {sublabel && <div className="label-mono" style={{ fontSize: 10 }}>{sublabel}</div>}
        </div>
        <div style={{ height: 6, background: 'var(--paper-deep)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, width: w + '%', background: accent, transition: 'width 0.4s' }} />
        </div>
      </div>
      <div className="numeral" style={{ fontSize: 18, fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
        {format(value)}
      </div>
    </div>
  );
}

// LineChart
interface LinePoint { x: number; y: number; }
interface LineSeries { color?: string; thick?: boolean; dash?: string; points: LinePoint[]; label?: string; }
interface LineChartProps { series: LineSeries[]; height?: number; }
export function LineChart({ series, height = 180 }: LineChartProps) {
  const W = 600;
  const H = height;
  const padL = 40, padR = 16, padT = 16, padB = 28;

  const allX = series.flatMap(s => s.points.map(p => p.x));
  const allY = series.flatMap(s => s.points.map(p => p.y));
  const xMin = Math.min(...allX), xMax = Math.max(...allX);
  const yMin = 0;
  const yMax = Math.max(...allY) * 1.1 || 1;

  const sx = (x: number) => padL + ((x - xMin) / (xMax - xMin || 1)) * (W - padL - padR);
  const sy = (y: number) => H - padB - ((y - yMin) / (yMax - yMin || 1)) * (H - padT - padB);

  const yTicks = 4;
  const xTicks = [...new Set(allX)].sort((a, b) => a - b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padT + (i / yTicks) * (H - padT - padB);
        const v = yMax - (i / yTicks) * (yMax - yMin);
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--rule-soft)" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faded)" textAnchor="end">
              {v.toFixed(1)}
            </text>
          </g>
        );
      })}
      {xTicks.map(x => (
        <text key={x} x={sx(x)} y={H - padB + 16} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faded)" textAnchor="middle">
          &apos;{String(x).slice(2)}
        </text>
      ))}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="var(--ink)" strokeWidth="1" />
      {series.map((s, i) => {
        const path = s.points
          .slice()
          .sort((a, b) => a.x - b.x)
          .map((p, j) => `${j === 0 ? 'M' : 'L'}${sx(p.x)},${sy(p.y)}`)
          .join(' ');
        return (
          <g key={i}>
            <path d={path} fill="none" stroke={s.color || 'var(--ink)'} strokeWidth={s.thick ? 2.5 : 1.5} strokeDasharray={s.dash || 'none'} />
            {s.points.map((p, j) => (
              <circle key={j} cx={sx(p.x)} cy={sy(p.y)} r="2.5" fill={s.color || 'var(--ink)'} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ScatterPlot
interface ScatterPoint { x: number; y: number; label: string; size?: number; accent?: string; }
interface ScatterPlotProps {
  points: ScatterPoint[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  xRef?: number;
  yRef?: number;
  onHover?: (p: ScatterPoint | null) => void;
}
export function ScatterPlot({ points, height = 360, xLabel = '', yLabel = '', xRef, yRef, onHover }: ScatterPlotProps) {
  const W = 700;
  const H = height;
  const padL = 56, padR = 24, padT = 24, padB = 44;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs) * 0.95;
  const xMax = Math.max(...xs) * 1.05;
  const yMin = Math.min(...ys) * 0.95;
  const yMax = Math.max(...ys) * 1.05;

  const sx = (x: number) => padL + ((x - xMin) / (xMax - xMin || 1)) * (W - padL - padR);
  const sy = (y: number) => H - padB - ((y - yMin) / (yMax - yMin || 1)) * (H - padT - padB);

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: height }}>
      {xRef !== undefined && (
        <line x1={sx(xRef)} x2={sx(xRef)} y1={padT} y2={H - padB} stroke="var(--terracotta)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
      )}
      {yRef !== undefined && (
        <line x1={padL} x2={W - padR} y1={sy(yRef)} y2={sy(yRef)} stroke="var(--terracotta)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
      )}
      <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke="var(--ink)" strokeWidth="1" />
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="var(--ink)" strokeWidth="1" />
      {Array.from({ length: 5 }).map((_, i) => {
        const v = yMin + (i / 4) * (yMax - yMin);
        return (
          <g key={i}>
            <line x1={padL - 4} x2={padL} y1={sy(v)} y2={sy(v)} stroke="var(--ink)" />
            <text x={padL - 8} y={sy(v) + 3} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faded)" textAnchor="end">
              {v.toFixed(2)}
            </text>
          </g>
        );
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const v = xMin + (i / 4) * (xMax - xMin);
        return (
          <g key={i}>
            <line y1={H - padB} y2={H - padB + 4} x1={sx(v)} x2={sx(v)} stroke="var(--ink)" />
            <text y={H - padB + 16} x={sx(v)} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faded)" textAnchor="middle">
              {(v * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
      {points.map((p, i) => (
        <g key={i} style={{ cursor: 'pointer' }}
          onMouseEnter={() => { setHovered(i); onHover?.(p); }}
          onMouseLeave={() => { setHovered(null); onHover?.(null); }}
        >
          <circle
            cx={sx(p.x)} cy={sy(p.y)}
            r={hovered === i ? 7 : Math.max(3, Math.min(8, p.size || 5))}
            fill={p.accent || 'var(--ink)'}
            fillOpacity={hovered === i ? 1 : 0.7}
            stroke="var(--paper-bright)" strokeWidth="1"
          />
          {hovered === i && (
            <g>
              <text x={sx(p.x) + 10} y={sy(p.y) - 8} fontFamily="var(--font-sans)" fontSize="12" fontWeight="600" fill="var(--ink)">{p.label}</text>
              <text x={sx(p.x) + 10} y={sy(p.y) + 6} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faded)">
                {(p.x * 100).toFixed(1)}% hemma · {p.y.toFixed(2)} kort/match
              </text>
            </g>
          )}
        </g>
      ))}
      <text x={W / 2} y={H - 6} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faded)" textAnchor="middle" letterSpacing="1">
        {xLabel}
      </text>
      <text x={14} y={H / 2} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faded)" textAnchor="middle" letterSpacing="1" transform={`rotate(-90, 14, ${H / 2})`}>
        {yLabel}
      </text>
    </svg>
  );
}

// Sparkline
interface SparklineProps { values: number[]; color?: string; width?: number; height?: number; showDots?: boolean; fill?: boolean; }
export function Sparkline({ values, color = 'var(--ink)', width = 80, height = 24, showDots = false, fill = false }: SparklineProps) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i): [number, number] => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fillPath = fill ? `${path} L ${pts[pts.length - 1][0]},${height} L 0,${height} Z` : '';
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={fillPath} fill={color} fillOpacity="0.12" />}
      <path d={path} stroke={color} strokeWidth="1.4" fill="none" />
      {showDots && pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 2.5 : 1.5} fill={color} />
      ))}
    </svg>
  );
}

// StackedBar
interface StackedSegment { label: string; value: number; color: string; }
interface StackedBarProps { segments: StackedSegment[]; height?: number; }
export function StackedBar({ segments, height = 16 }: StackedBarProps) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div style={{ display: 'flex', height, width: '100%', background: 'var(--paper-deep)' }}>
      {segments.map((s, i) => (
        <div
          key={i}
          title={`${s.label}: ${s.value}`}
          style={{ width: total ? (s.value / total) * 100 + '%' : 0, background: s.color, transition: 'width 0.4s' }}
        />
      ))}
    </div>
  );
}

// BigNumber
interface BigNumberProps { value: string | number; label: string; change?: string; color?: string; suffix?: string; size?: number; }
export function BigNumber({ value, label, change, color = 'var(--ink)', suffix = '', size = 64 }: BigNumberProps) {
  return (
    <div>
      <div className="label-mono" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'block' }}>
        <span className="numeral" style={{ display: 'block', fontSize: size, fontWeight: 600, color, lineHeight: 0.95, letterSpacing: '-0.025em' }}>
          {value}
        </span>
        {suffix && (
          <span className="label-mono" style={{ display: 'block', marginTop: 6, color: 'var(--ink-faded)' }}>
            {suffix}
          </span>
        )}
      </div>
      {change && (
        <div className="label-mono" style={{ marginTop: 6, color: change.startsWith('+') ? 'var(--forest)' : 'var(--terracotta)' }}>
          {change}
        </div>
      )}
    </div>
  );
}

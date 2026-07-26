'use client';

import { useEffect, useMemo, useState } from 'react';

type Lang = 'en' | 'ko';
type MetricKey = 'inside_temperature_c' | 'inside_relative_humidity_pct' | 'co2_ppm' | 'substrate_water_content_pct' | 'substrate_ec_ds_m';
type Day = { date: string; mean: number; min: number; max: number };
type WeekData = { range_start: string; range_end: string; weekly_daily: Record<MetricKey, Day[]> };

const meta: Record<MetricKey, { en: string; ko: string; unit: string; color: string }> = {
  inside_temperature_c: { en: 'Inside temperature', ko: '내부 온도', unit: '°C', color: '#e9cb7a' },
  inside_relative_humidity_pct: { en: 'Inside relative humidity', ko: '내부 상대습도', unit: '%', color: '#b6d99c' },
  co2_ppm: { en: 'CO₂', ko: 'CO₂', unit: 'ppm', color: '#95c7b0' },
  substrate_water_content_pct: { en: 'Substrate water content', ko: '배지 함수율', unit: '%', color: '#77b9cd' },
  substrate_ec_ds_m: { en: 'Substrate EC', ko: '배지 EC', unit: 'dS/m', color: '#e69d73' },
};

function points(values: number[], width: number, height: number, pad = 30) {
  const low = Math.min(...values); const high = Math.max(...values); const span = high - low || 1;
  return values.map((value, i) => `${i ? 'L' : 'M'} ${pad + i * ((width - 2 * pad) / Math.max(values.length - 1, 1))} ${height - pad - ((value - low) / span) * (height - 2 * pad)}`).join(' ');
}

export default function CaseView() {
  const [data, setData] = useState<WeekData | null>(null);
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const rawMetric = params.get('metric') as MetricKey;
  const metric: MetricKey = rawMetric in meta ? rawMetric : 'inside_temperature_c';
  const lang: Lang = params.get('lang') === 'ko' ? 'ko' : 'en';
  const label = meta[metric][lang];
  const text = lang === 'ko' ? { eyebrow: 'CMAA 사례 패킷 · 이전 7일', title: '이전 7일 변화', detail: '각 점은 일평균이며, 세로 범위는 해당 일의 최솟값–최댓값을 나타냄. 상태 점수나 관리 추천은 표시하지 않음', mean: '일평균', range: '일 최솟값–최댓값', source: '원자료 보존형 interim sensor table에서 생성' } : { eyebrow: 'CMAA CASE PACKET · PREVIOUS 7 DAYS', title: 'Previous 7-day change', detail: 'Each point is a daily mean; the vertical range shows that day’s minimum–maximum. No status score or management recommendation is displayed.', mean: 'Daily mean', range: 'Daily min–max', source: 'Generated from the original-preserving interim sensor table' };

  useEffect(() => { fetch('/case-assets/b2-20251211/week_data.json').then((r) => r.json()).then(setData); }, []);
  const days = useMemo(() => data?.weekly_daily[metric] ?? [], [data, metric]);
  if (!data || !days.length) return <main className="week-page"><p>Loading case trend…</p></main>;
  const values = days.flatMap((d) => [d.min, d.max]);
  const low = Math.min(...values); const high = Math.max(...values); const span = high - low || 1;
  const y = (v: number) => 250 - 30 - ((v - low) / span) * 190;

  return <main className="week-page"><header><p>{text.eyebrow}</p><h1>{label}</h1><h2>{text.title} · {data.range_start} — {data.range_end}</h2><span>{text.detail}</span></header><section className="week-chart"><div className="week-legend"><b style={{ color: meta[metric].color }}>● {text.mean}</b><span>│ {text.range}</span><small>{meta[metric].unit}</small></div><svg viewBox="0 0 760 280" role="img" aria-label={`${label} weekly trend`}><line x1="30" y1="30" x2="30" y2="250" /><line x1="30" y1="250" x2="730" y2="250" />{days.map((d, i) => { const x = 45 + i * (670 / Math.max(days.length - 1, 1)); return <g key={d.date}><line x1={x} x2={x} y1={y(d.min)} y2={y(d.max)} stroke="rgba(237,243,233,.45)" strokeWidth="3" /><circle cx={x} cy={y(d.mean)} r="5" fill={meta[metric].color} /><text x={x} y="272" textAnchor="middle">{d.date.slice(5)}</text></g>; })}<path d={days.map((d, i) => `${i ? 'L' : 'M'} ${45 + i * (670 / Math.max(days.length - 1, 1))} ${y(d.mean)}`).join(' ')} fill="none" stroke={meta[metric].color} strokeWidth="2.5" /></svg><div className="week-scale"><span>{high.toFixed(metric === 'co2_ppm' ? 0 : 2)} {meta[metric].unit}</span><span>{low.toFixed(metric === 'co2_ppm' ? 0 : 2)} {meta[metric].unit}</span></div></section><footer>{text.source}</footer></main>;
}

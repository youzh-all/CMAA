'use client';

import { useEffect, useMemo, useState } from 'react';

type Lang = 'en' | 'ko';
type Metric = { mean: number; min: number; max: number; n: number };
type HourlyRow = Record<string, number | string>;
type Packet = {
  greenhouse_id: number;
  anchor_date_local: string;
  image_views: { label: string; timestamp_local: string; display_asset: string; source_image_id: string }[];
  sensor_day_summary: Record<string, Metric>;
  sensor_hourly: HourlyRow[];
  growth_observation_date: string;
  growth_summary: Record<string, number | null>;
  harvest_date: string | null;
  harvest_summary: Record<string, number | null>;
};

type MetricKey = 'inside_temperature_c' | 'inside_relative_humidity_pct' | 'co2_ppm' | 'substrate_water_content_pct' | 'substrate_ec_ds_m';

const text = {
  en: {
    title: 'Case evidence — inspect before dialogue', note: 'The Apprentice asks about this packet. Images, day-level sensor context, growth observations, and follow-up harvest data are shown without a status score or recommendation.', display: 'Display derivatives · originals remain in CMAA storage', day: '11 Dec 2025 · greenhouse 2',
    temp: 'Inside temperature', rh: 'Inside RH', co2: 'CO₂', water: 'Substrate water', ec: 'Substrate EC', growth: 'Latest growth observation', harvest: 'Same-day harvest outcome', observed: 'observed', followup: 'follow-up only', plantHeight: 'Plant height', leafCount: 'Leaf count', crown: 'Crown diameter', fruitSet: 'Fruit set count', marketable: 'Marketable rate', marketableCount: 'Marketable fruit', meanWeight: 'Mean fruit weight', brix: 'Mean Brix', source: 'Source-linked display packet', loading: 'Loading the selected case packet…', unavailable: 'Case packet could not be loaded.',
    dailyChart: 'Within-day change', openWeek: 'Open previous 7-day view', priorDay: 'Previous day', nextDay: 'Next day', viewDate: 'Image observation date', range: 'hourly mean'
  },
  ko: {
    title: '사례 근거 — 대화 전에 직접 확인', note: 'Apprentice는 이 패킷을 보고 질문함. 이미지, 일 단위 센서 맥락, 생육 관측, 후속 수확 자료를 상태점수나 추천 없이 함께 표시함', display: '표시용 파생본 · 원본은 CMAA 저장소에 보존', day: '2025년 12월 11일 · 2동',
    temp: '내부 온도', rh: '내부 상대습도', co2: 'CO₂', water: '배지 함수율', ec: '배지 EC', growth: '가장 최근 생육 관측', harvest: '당일 수확 결과', observed: '관측일', followup: '후속 결과만 사용', plantHeight: '초장', leafCount: '엽수', crown: '관부 직경', fruitSet: '착과수', marketable: '상품과율', marketableCount: '상품과 수', meanWeight: '상품과 평균중', brix: '평균 당도', source: '출처 연결 표시 패킷', loading: '선택된 사례 패킷을 불러오는 중…', unavailable: '사례 패킷을 불러오지 못함',
    dailyChart: '당일 변화', openWeek: '이전 7일 변화 열기', priorDay: '이전 날', nextDay: '다음 날', viewDate: '이미지 관측일', range: '시간별 평균'
  }
} as const;

const metricMeta: { key: MetricKey; label: keyof typeof text.en; unit: string; digits: number; color: string }[] = [
  { key: 'inside_temperature_c', label: 'temp', unit: '°C', digits: 1, color: '#e9cb7a' },
  { key: 'inside_relative_humidity_pct', label: 'rh', unit: '%', digits: 1, color: '#b6d99c' },
  { key: 'co2_ppm', label: 'co2', unit: 'ppm', digits: 0, color: '#95c7b0' },
  { key: 'substrate_water_content_pct', label: 'water', unit: '%', digits: 1, color: '#77b9cd' },
  { key: 'substrate_ec_ds_m', label: 'ec', unit: 'dS/m', digits: 2, color: '#e69d73' },
];

function pathFor(values: number[], width = 240, height = 56, pad = 5) {
  const low = Math.min(...values); const high = Math.max(...values); const span = high - low || 1;
  return values.map((v, i) => `${i ? 'L' : 'M'} ${(i / Math.max(values.length - 1, 1)) * width} ${height - pad - ((v - low) / span) * (height - pad * 2)}`).join(' ');
}

function DailyTrend({ metric, rows, lang, title }: { metric: typeof metricMeta[number]; rows: HourlyRow[]; lang: Lang; title: string }) {
  const t = text[lang];
  const values = rows.map((row) => Number(row[metric.key])).filter((value) => Number.isFinite(value));
  const hours = rows.map((row) => String(row.hour));
  if (!values.length) return null;
  return <button className="trend-card" type="button" onClick={() => window.open(`/case-view?metric=${metric.key}&lang=${lang}`, '_blank', 'noopener')} aria-label={`${title}: ${t.openWeek}`}>
    <div><span>{title}</span><small>{t.openWeek} ↗</small></div>
    <svg viewBox="0 0 240 56" preserveAspectRatio="none" role="img" aria-label={`${title} ${t.dailyChart}`}><path d={pathFor(values)} fill="none" stroke={metric.color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" /></svg>
    <footer><span>{hours[0]}</span><b>{t.dailyChart}</b><span>{hours[hours.length - 1]}</span></footer>
  </button>;
}

export function CaseEvidence({ lang }: { lang: Lang }) {
  const [packet, setPacket] = useState<Packet | null>(null);
  const [error, setError] = useState(false);
  const [imageIndex, setImageIndex] = useState(7);
  const t = text[lang];

  useEffect(() => { fetch('/case-assets/b2-20251211/case_packet.json').then((r) => r.ok ? r.json() : Promise.reject()).then((p: Packet) => setPacket(p)).catch(() => setError(true)); }, []);
  const metrics = useMemo(() => packet ? metricMeta.map((meta) => ({ ...meta, value: packet.sensor_day_summary[meta.key] })) : [], [packet]);
  if (error) return <section className="case-evidence error">{t.unavailable}</section>;
  if (!packet) return <section className="case-evidence loading">{t.loading}</section>;

  const imageDates = ['2025-12-04', '2025-12-05', '2025-12-06', '2025-12-07', '2025-12-08', '2025-12-09', '2025-12-10', '2025-12-11'];
  const imageDate = imageDates[imageIndex];
  const imageSet = { date: imageDate, caption: lang === 'ko' ? `${imageDate.replaceAll('-', '. ')}. · 2동` : `${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${imageDate}T12:00:00`))} · greenhouse 2`, base: `/case-assets/b2-${imageDate.replaceAll('-', '')}` };
  const images = packet.image_views.map((view) => ({ ...view, display_asset: `${imageSet.base}/${view.display_asset.split('/').pop()}`, timestamp_local: view.timestamp_local.replace('20251211', imageSet.date.replaceAll('-', '')) }));

  return <section id="case-evidence" className="case-evidence" aria-label={t.title}>
    <div className="case-evidence-head"><div><p className="section-label">{t.source}</p><h2>{t.title}</h2><p>{t.note}</p></div><div className="case-date"><b>{t.day}</b><span>{t.display}</span></div></div>
    <div className="image-toolbar"><div><span>{t.viewDate}</span><b>{imageSet.caption}</b></div><div><button type="button" disabled={imageIndex === 0} onClick={() => setImageIndex((index) => index - 1)}>← {t.priorDay}</button><button type="button" disabled={imageIndex === imageDates.length - 1} onClick={() => setImageIndex((index) => index + 1)}>{t.nextDay} →</button></div></div>
    <div className="case-images">{images.map((view) => <figure key={`${imageSet.date}-${view.source_image_id}`}><img src={view.display_asset} alt={`Greenhouse 2 ${view.label} strawberry canopy view`} /><figcaption><b>{view.label}</b><span>{view.timestamp_local.slice(0, 4)}-{view.timestamp_local.slice(4, 6)}-{view.timestamp_local.slice(6, 8)} {view.timestamp_local.slice(8, 10)}:{view.timestamp_local.slice(10, 12)}</span></figcaption></figure>)}</div>
    <div className="metric-grid">{metrics.map(({ key, label, value, unit, digits }) => <article key={key}><span>{t[label]}</span><b>{value.mean.toFixed(digits)} <small>{unit}</small></b><p>min–max {value.min.toFixed(digits)}–{value.max.toFixed(digits)}</p></article>)}</div>
    <details id="data-explorer" className="source-data-explorer"><summary>{lang === 'ko' ? '원자료 탐색기 · 시간별 관측값 열기' : 'Data explorer · open source-level hourly observations'}</summary><p>{lang === 'ko' ? '현재 사례에 연결된 표시용 시간별 관측값임. 각 값은 원 관측 맥락이며, Agent 지표값이나 추천이 아님' : 'Hourly display records linked to this case. These are source observations, not an Agent score or recommendation.'}</p><div className="raw-table-wrap"><table><thead><tr><th>Hour</th>{metricMeta.map((metric) => <th key={metric.key}>{t[metric.label]}</th>)}</tr></thead><tbody>{packet.sensor_hourly.map((row) => <tr key={String(row.hour)}><td>{String(row.hour)}</td>{metricMeta.map((metric) => <td key={metric.key}>{Number(row[metric.key]).toFixed(metric.digits)}</td>)}</tr>)}</tbody></table></div><small>{lang === 'ko' ? '역할: direct measurement / time-aligned context · 결측·단위·source scope는 case packet 기준으로 함께 해석함' : 'Role: direct measurement / time-aligned context. Interpret missingness, units and source scope with the case packet.'}</small></details>
    <div className="trend-section"><div><span>{t.dailyChart}</span><b>{t.range}</b></div><div className="trend-grid">{metricMeta.map((metric) => <DailyTrend key={metric.key} metric={metric} rows={packet.sensor_hourly} lang={lang} title={t[metric.label]} />)}</div></div>
    <div className="case-tables">
      <article><div><span>{t.growth}</span><b>{packet.growth_observation_date} · {t.observed}</b></div><dl><dt>{t.plantHeight}</dt><dd>{packet.growth_summary.plant_height_cm?.toFixed(2)} cm</dd><dt>{t.leafCount}</dt><dd>{packet.growth_summary.leaf_count?.toFixed(2)}</dd><dt>{t.crown}</dt><dd>{packet.growth_summary.crown_diameter_mm?.toFixed(2)} mm</dd><dt>{t.fruitSet}</dt><dd>{packet.growth_summary.fruit_set_count?.toFixed(2)}</dd></dl></article>
      <article><div><span>{t.harvest}</span><b>{packet.harvest_date} · {t.followup}</b></div><dl><dt>{t.marketable}</dt><dd>{packet.harvest_summary.marketable_fruit_rate ? `${(packet.harvest_summary.marketable_fruit_rate * 100).toFixed(1)}%` : '—'}</dd><dt>{t.marketableCount}</dt><dd>{packet.harvest_summary.marketable_fruit_count}</dd><dt>{t.meanWeight}</dt><dd>{packet.harvest_summary.marketable_mean_weight_g?.toFixed(2)} g</dd><dt>{t.brix}</dt><dd>{packet.harvest_summary.marketable_mean_brix?.toFixed(2)} °Bx</dd></dl></article>
    </div>
  </section>;
}

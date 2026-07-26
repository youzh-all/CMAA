'use client';

import { useEffect, useMemo, useState } from 'react';

type Lang = 'en' | 'ko';
type Metric = { mean: number; min: number; max: number; n: number };
type Packet = {
  case_id: string;
  greenhouse_id: number;
  anchor_date_local: string;
  scope_note: string;
  image_views: { label: string; timestamp_local: string; display_asset: string; source_image_id: string }[];
  sensor_day_summary: Record<string, Metric>;
  sensor_hourly: Record<string, number | string>[];
  growth_observation_date: string;
  growth_summary: Record<string, number | null>;
  harvest_date: string | null;
  harvest_summary: Record<string, number | null>;
};

const text = {
  en: {
    title: 'Case evidence — inspect before dialogue',
    note: 'The Apprentice asks about this packet. Images, day-level sensor context, growth observations, and follow-up harvest data are shown without a status score or recommendation.',
    display: 'Display derivatives · originals remain in CMAA storage',
    day: '11 Dec 2025 · greenhouse 2',
    temp: 'Inside temperature', rh: 'Inside RH', co2: 'CO₂', water: 'Substrate water', ec: 'Substrate EC',
    growth: 'Latest growth observation', harvest: 'Same-day harvest outcome', observed: 'observed', followup: 'follow-up only',
    plantHeight: 'Plant height', leafCount: 'Leaf count', crown: 'Crown diameter', fruitSet: 'Fruit set count',
    marketable: 'Marketable rate', marketableCount: 'Marketable fruit', meanWeight: 'Mean fruit weight', brix: 'Mean Brix',
    source: 'Source-linked display packet', loading: 'Loading the selected case packet…', unavailable: 'Case packet could not be loaded.'
  },
  ko: {
    title: '사례 근거 — 대화 전에 직접 확인',
    note: 'Apprentice는 이 패킷을 보고 질문함. 이미지, 일 단위 센서 맥락, 생육 관측, 후속 수확 자료를 상태점수나 추천 없이 함께 표시함',
    display: '표시용 파생본 · 원본은 CMAA 저장소에 보존',
    day: '2025년 12월 11일 · 2동',
    temp: '내부 온도', rh: '내부 상대습도', co2: 'CO₂', water: '배지 함수율', ec: '배지 EC',
    growth: '가장 최근 생육 관측', harvest: '당일 수확 결과', observed: '관측일', followup: '후속 결과만 사용',
    plantHeight: '초장', leafCount: '엽수', crown: '관부 직경', fruitSet: '착과수',
    marketable: '상품과율', marketableCount: '상품과 수', meanWeight: '상품과 평균중', brix: '평균 당도',
    source: '출처 연결 표시 패킷', loading: '선택된 사례 패킷을 불러오는 중…', unavailable: '사례 패킷을 불러오지 못함'
  }
} as const;

function range(metric: Metric, digits = 1) {
  return `${metric.mean.toFixed(digits)} · ${metric.min.toFixed(digits)}–${metric.max.toFixed(digits)}`;
}

export function CaseEvidence({ lang }: { lang: Lang }) {
  const [packet, setPacket] = useState<Packet | null>(null);
  const [error, setError] = useState(false);
  const t = text[lang];

  useEffect(() => {
    fetch('/case-assets/b2-20251211/case_packet.json')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('packet unavailable')))
      .then((payload: Packet) => setPacket(payload))
      .catch(() => setError(true));
  }, []);

  const metrics = useMemo(() => packet ? [
    [t.temp, packet.sensor_day_summary.inside_temperature_c, '°C', 1],
    [t.rh, packet.sensor_day_summary.inside_relative_humidity_pct, '%', 1],
    [t.co2, packet.sensor_day_summary.co2_ppm, 'ppm', 0],
    [t.water, packet.sensor_day_summary.substrate_water_content_pct, '%', 1],
    [t.ec, packet.sensor_day_summary.substrate_ec_ds_m, 'dS/m', 2],
  ] as const : [], [packet, t]);

  if (error) return <section className="case-evidence error">{t.unavailable}</section>;
  if (!packet) return <section className="case-evidence loading">{t.loading}</section>;

  return <section className="case-evidence" aria-label={t.title}>
    <div className="case-evidence-head"><div><p className="section-label">{t.source}</p><h2>{t.title}</h2><p>{t.note}</p></div><div className="case-date"><b>{t.day}</b><span>{t.display}</span></div></div>
    <div className="case-images">{packet.image_views.map((view) => <figure key={view.source_image_id}><img src={view.display_asset} alt={`Greenhouse 2 ${view.label} strawberry canopy view`} /><figcaption><b>{view.label}</b><span>{view.timestamp_local.slice(0, 4)}-{view.timestamp_local.slice(4, 6)}-{view.timestamp_local.slice(6, 8)} {view.timestamp_local.slice(8, 10)}:{view.timestamp_local.slice(10, 12)}</span></figcaption></figure>)}</div>
    <div className="metric-grid">{metrics.map(([label, value, unit, digits]) => <article key={label}><span>{label}</span><b>{value.mean.toFixed(digits)} <small>{unit}</small></b><p>min–max {value.min.toFixed(digits)}–{value.max.toFixed(digits)}</p></article>)}</div>
    <div className="case-tables">
      <article><div><span>{t.growth}</span><b>{packet.growth_observation_date} · {t.observed}</b></div><dl><dt>{t.plantHeight}</dt><dd>{packet.growth_summary.plant_height_cm?.toFixed(2)} cm</dd><dt>{t.leafCount}</dt><dd>{packet.growth_summary.leaf_count?.toFixed(2)}</dd><dt>{t.crown}</dt><dd>{packet.growth_summary.crown_diameter_mm?.toFixed(2)} mm</dd><dt>{t.fruitSet}</dt><dd>{packet.growth_summary.fruit_set_count?.toFixed(2)}</dd></dl></article>
      <article><div><span>{t.harvest}</span><b>{packet.harvest_date} · {t.followup}</b></div><dl><dt>{t.marketable}</dt><dd>{packet.harvest_summary.marketable_fruit_rate ? `${(packet.harvest_summary.marketable_fruit_rate * 100).toFixed(1)}%` : '—'}</dd><dt>{t.marketableCount}</dt><dd>{packet.harvest_summary.marketable_fruit_count}</dd><dt>{t.meanWeight}</dt><dd>{packet.harvest_summary.marketable_mean_weight_g?.toFixed(2)} g</dd><dt>{t.brix}</dt><dd>{packet.harvest_summary.marketable_mean_brix?.toFixed(2)} °Bx</dd></dl></article>
    </div>
  </section>;
}

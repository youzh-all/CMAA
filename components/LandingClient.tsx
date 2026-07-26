'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Lang = 'en' | 'ko';

const copy = {
  en: {
    nav: 'Research workspace', open: 'Open workspace', eyebrow: 'CULTIVATION MASTER–APPRENTICE AGENT',
    title: 'Make cultivation judgement inspectable.', lead: 'CMAA is a Master-guided research workspace for turning case-based cultivation observation into reviewed Composite Crop-State Indicator specifications.',
    primary: 'Inspect a live case', secondary: 'View workflow',
    trustA: 'Master-first', trustB: 'Source-linked evidence', trustC: 'Reviewable specifications',
    panelEyebrow: 'CURRENT CASE · B2', panelTitle: 'Inspect evidence before explanation', panelNote: 'Image, environment, root-zone, growth, and outcome evidence remain distinct.',
    sectionEyebrow: 'HOW THE WORKSPACE WORKS', sectionTitle: 'Observation first. Formalization second.',
    steps: [
      ['01', 'Inspect a case', 'Review visual, environmental, root-zone, growth, and follow-up outcome evidence in its recorded context.'],
      ['02', 'Record Master judgement', 'Capture what the Master notices before candidates, labels, thresholds, or actions are introduced.'],
      ['03', 'Challenge and specify', 'Use traceable evidence to refine a candidate relationship into a reviewed indicator specification.'],
      ['04', 'Preserve the review trail', 'Keep interpretation, feasibility, contradiction, and version decisions separate and inspectable.'],
    ],
    principle: 'CMAA does not turn a single observation into a diagnosis or control recommendation.',
    bottom: 'Start with a case, not a score.', footer: 'CMAA · Cultivation Master–Apprentice Agent'
  },
  ko: {
    nav: '연구 워크스페이스', open: '워크스페이스 열기', eyebrow: 'CULTIVATION MASTER–APPRENTICE AGENT',
    title: '재배 판단을 검토 가능한 지식으로 만듭니다.', lead: 'CMAA는 사례 기반 재배 관찰을 Master와 함께 검토하고 복합 작물상태지표 정의서로 형식화하기 위한 연구 워크스페이스입니다.',
    primary: '실제 사례 살펴보기', secondary: '워크플로우 보기',
    trustA: 'Master 우선', trustB: '출처 연결 근거', trustC: '검토 가능한 정의서',
    panelEyebrow: '현재 사례 · B2', panelTitle: '설명 전에 근거를 직접 확인합니다', panelNote: '이미지, 환경, 근권, 생육, 후속 결과 근거를 서로 구분해 보존합니다',
    sectionEyebrow: 'WORKSPACE 작동 방식', sectionTitle: '관찰이 먼저, 형식화가 나중입니다.',
    steps: [
      ['01', '사례를 확인', '기록된 맥락 안에서 시각·환경·근권·생육·후속 결과 근거를 함께 검토합니다'],
      ['02', 'Master 판단을 기록', '후보·명칭·임계값·행동을 제시하기 전에 Master가 무엇을 보았는지 기록합니다'],
      ['03', '반례 검토와 정의', '추적 가능한 근거를 사용해 후보 관계를 검토된 지표 정의서로 구체화합니다'],
      ['04', '검토 이력을 보존', '해석·데이터 가능성·반례·버전 결정을 분리해 검토 가능하게 보존합니다'],
    ],
    principle: 'CMAA는 하나의 관찰을 진단이나 제어 추천으로 단정하지 않습니다.',
    bottom: '점수가 아니라 사례에서 시작합니다.', footer: 'CMAA · Cultivation Master–Apprentice Agent'
  }
} as const;

export function LandingClient() {
  const [lang, setLang] = useState<Lang>('en');
  useEffect(() => { const stored = window.localStorage.getItem('cmaa-lang'); if (stored === 'ko' || stored === 'en') setLang(stored); }, []);
  const toggle = () => setLang((value) => { const next = value === 'en' ? 'ko' : 'en'; window.localStorage.setItem('cmaa-lang', next); return next; });
  const t = copy[lang];
  return <main className="landing">
    <nav className="landing-nav"><Link href="/" className="landing-brand"><span>✦</span> CMAA</Link><div><span>{t.nav}</span><button onClick={toggle}>{lang === 'en' ? 'KOR' : 'ENG'}</button><Link href="/workspace" className="nav-cta">{t.open} ↗</Link></div></nav>
    <section className="landing-hero"><div className="hero-copy"><p>{t.eyebrow}</p><h1>{t.title}</h1><p className="hero-lead">{t.lead}</p><div className="hero-actions"><Link href="/workspace" className="primary-cta">{t.primary} <b>→</b></Link><a href="#workflow" className="secondary-cta">{t.secondary}</a></div><div className="trust-row"><span>● {t.trustA}</span><span>● {t.trustB}</span><span>● {t.trustC}</span></div></div>
      <aside className="landing-scene" aria-label={t.panelTitle}><img className="scene-background" src="/landing/greenhouse-background.png" alt="Strawberry greenhouse illustration" /><div className="scene-wash"></div><div className="scene-label"><p>{t.panelEyebrow}</p><h2>{t.panelTitle}</h2><small>{t.panelNote}</small></div><img className="scene-master" src="/landing/master-grower.png" alt="Master grower" /><img className="scene-agent" src="/landing/apprentice-agent.png" alt="Apprentice agent" /></aside>
    </section>
    <section className="landing-banner" aria-label="CMAA identity banner"><img src="/landing/cmaa-banner.png" alt="CMAA — Cultivation Master–Apprentice Agent. Learning from wisdom, growing the future." /></section>
    <section id="workflow" className="landing-workflow"><p>{t.sectionEyebrow}</p><h2>{t.sectionTitle}</h2><div>{t.steps.map(([number, title, description]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="landing-principle"><span>◆</span><p>{t.principle}</p></section>
    <section className="landing-bottom"><h2>{t.bottom}</h2><Link href="/workspace" className="primary-cta">{t.open} <b>→</b></Link></section>
    <footer>{t.footer}<span>· Research prototype</span></footer>
  </main>;
}

'use client';

import { useEffect, useMemo, useState } from 'react';

type Lang = 'en' | 'ko';
type CandidateId = 'VRBI' | 'IFLI' | 'FSMSI';

const candidates: Record<CandidateId, { name: string; ko: string; construct: string; components: string[]; linkage: string }> = {
  VRBI: { name: 'Vegetative–Reproductive Balance Index', ko: '영양–생식 균형 지수', construct: 'Vegetative support relative to reproductive demand', components: ['leaf count', 'crown diameter', 'plant height', 'unopened flower count', 'open flower count', 'fruit set count'], linkage: 'same plant × linked truss × repeated observation' },
  IFLI: { name: 'Inflorescence–Fruit Load Index', ko: '화방–과실 부하 지수', construct: 'Truss-level fruit-load structure relative to plant support', components: ['truss ID', 'fruit position', 'fruit count', 'maturity class', 'peduncle posture', 'contact-fruit flag'], linkage: 'same truss × linked fruit positions × harvest event' },
  FSMSI: { name: 'Fruit Size–Maturity Synchrony Index', ko: '과실 크기–숙도 동기성 지수', construct: 'Same-fruit size–maturity developmental synchrony', components: ['fruit ID / position', 'anthesis or fruit-set date', 'repeated size', 'maturity class', 'linked harvest', 'repeated image ID'], linkage: 'same plant × same truss × fruit position × repeated observation' },
};

const labels = {
  en: { eyebrow: 'Composite Indicator Studio', title: 'From Master cue to a managed indicator', cue: '1 · Master cue', proposal: '2 · Agent proposal', select: '3 · Component selection', rounds: '4 · Review rounds', spec: '5 · Specification', build: '6 · Build & save', apply: '7 · Apply & manage', cueEmpty: 'Record a Master-first observation in the dialogue to unlock candidate proposals.', cueReady: 'Master cue captured', candidates: 'Candidate relations', selectHint: 'Select the observations the Master considers essential. This does not approve a formula.', boundary: 'Counterexample & boundary review', boundaryText: 'Record exceptions, non-applicability, and recheck conditions before any deterministic build.', specification: 'Composite Crop-State Indicator Specification', formula: 'Formula eligibility', blocked: 'Not eligible — linkage and repeated tracking are required.', buildText: 'The 2222 server will create versioned feature/QC artifacts. No raw data or API key enters Vercel.', applyText: 'Only validated versions may calculate new cases. “Delete” becomes retire/supersede with the audit history retained.', selected: 'selected', review: 'Review candidate', status: 'data collection required' },
  ko: { eyebrow: '복합지표 스튜디오', title: 'Master 단서에서 관리 가능한 지표까지', cue: '1 · Master 단서', proposal: '2 · Agent 후보 제안', select: '3 · 구성요소 선별', rounds: '4 · 검토 round', spec: '5 · 지표 정의서', build: '6 · 구축 및 저장', apply: '7 · 활용 및 관리', cueEmpty: 'Master-first 대화에 독립 관찰을 기록하면 후보 제안이 열립니다.', cueReady: 'Master 단서 기록됨', candidates: '후보 관계', selectHint: 'Master가 필수라고 보는 관측값을 선택합니다. 수식 승인이나 점수 산출이 아닙니다.', boundary: '반례 및 경계 검토', boundaryText: '결정론적 구축 전에 예외·비적용 조건·재확인 기준을 기록합니다.', specification: '복합 작물상태지표 정의서', formula: '수식 적용 가능성', blocked: '현재는 불가 — 동일 개체 linkage와 반복 추적이 필요합니다.', buildText: '2222 서버가 versioned feature/QC artifact를 생성합니다. 원자료와 API key는 Vercel에 들어가지 않습니다.', applyText: '검증된 version만 새 사례에 계산할 수 있습니다. 삭제는 audit 이력을 남기는 retire/supersede로 처리합니다.', selected: '선택됨', review: '후보 검토', status: '추적 데이터 필요' },
} as const;

export function CompositeIndicatorStudio({ lang, masterCue }: { lang: Lang; masterCue: string }) {
  const t = labels[lang];
  const [candidateId, setCandidateId] = useState<CandidateId>('VRBI');
  const [selected, setSelected] = useState<string[]>([]);
  const [bridgeState, setBridgeState] = useState<'idle' | 'loading' | 'connected' | 'unavailable'>('idle');
  const [serverProposalIds, setServerProposalIds] = useState<string[]>([]);
  const cueReady = Boolean(masterCue.trim());
  const candidate = candidates[candidateId];
  const selectedComponents = useMemo(() => selected.filter((item) => candidate.components.includes(item)), [candidate.components, selected]);
  useEffect(() => {
    if (!cueReady) { setBridgeState('idle'); setServerProposalIds([]); return; }
    const controller = new AbortController();
    setBridgeState('loading');
    fetch('/api/cmaa/candidate-proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: 'B2-20251211', masterCue }), signal: controller.signal })
      .then(async (response) => ({ ok: response.ok, payload: await response.json() }))
      .then(({ ok, payload }) => { if (!ok) throw new Error(payload?.code || 'bridge_unavailable'); setServerProposalIds((payload.proposals || []).map((item: { candidate_id: string }) => item.candidate_id)); setBridgeState('connected'); })
      .catch(() => { if (!controller.signal.aborted) setBridgeState('unavailable'); });
    return () => controller.abort();
  }, [cueReady, masterCue]);
  const bridgeLabel = bridgeState === 'connected' ? '2222 server proposal verified' : bridgeState === 'loading' ? 'Checking 2222 candidate service…' : bridgeState === 'unavailable' ? 'Server bridge not configured — local UI preview only' : t.cueEmpty;
  const toggle = (component: string) => setSelected((items) => items.includes(component) ? items.filter((item) => item !== component) : [...items, component]);
  return <section className="indicator-studio" id="indicator-studio">
    <div className="indicator-studio-head"><div><p className="section-label">{t.eyebrow}</p><h2>{t.title}</h2></div><span>{cueReady ? `${t.cueReady} · ${bridgeLabel}` : t.cueEmpty}</span></div>
    <ol className="indicator-flow">{[t.cue, t.proposal, t.select, t.rounds, t.spec, t.build, t.apply].map((label, index) => <li key={label} className={cueReady && index < 3 ? 'ready' : ''}>{label}</li>)}</ol>
    {!cueReady ? <div className="indicator-gate">{t.cueEmpty}</div> : <div className="indicator-grid">
      <article className="cue-card"><span>{t.cue}</span><p>{masterCue}</p></article>
      <article className="candidate-card"><span>{t.proposal}</span><h3>{t.candidates}</h3><div className="candidate-buttons">{(Object.keys(candidates) as CandidateId[]).filter((id) => bridgeState !== 'connected' || serverProposalIds.includes(id)).map((id) => <button key={id} className={candidateId === id ? 'selected' : ''} onClick={() => { setCandidateId(id); setSelected([]); }}><b>{id}</b><small>{lang === 'ko' ? candidates[id].ko : candidates[id].name}</small><em>{t.status}</em></button>)}</div></article>
      <article className="selection-card"><span>{t.select}</span><h3>{lang === 'ko' ? candidate.ko : candidate.name}</h3><p>{candidate.construct}</p><small>{t.selectHint}</small><div className="component-list">{candidate.components.map((component) => <label key={component}><input type="checkbox" checked={selectedComponents.includes(component)} onChange={() => toggle(component)} /> <span>{component}</span></label>)}</div></article>
      <article className="boundary-card"><span>{t.rounds}</span><h3>{t.boundary}</h3><p>{t.boundaryText}</p><dl><dt>Required linkage</dt><dd>{candidate.linkage}</dd><dt>Current status</dt><dd>{t.status}</dd></dl></article>
      <article className="spec-card"><span>{t.spec}</span><h3>{t.specification}</h3><dl><dt>Candidate</dt><dd>{candidateId}</dd><dt>{t.selected}</dt><dd>{selectedComponents.length ? selectedComponents.join(' · ') : '—'}</dd><dt>{t.formula}</dt><dd>{t.blocked}</dd></dl></article>
      <article className="server-card"><span>{t.build}</span><p>{t.buildText}</p><span>{t.apply}</span><p>{t.applyText}</p></article>
    </div>}
  </section>;
}

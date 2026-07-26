'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Lang = 'en' | 'ko';
type ChatMessage = { id: string; role: 'assistant' | 'master'; text: string };
type Decision = 'retain' | 'revise' | 'split' | 'merge' | 'reject' | 'defer' | '';
type SavedRecord = { id: string; time: string; decision: Decision; note: string };

const copy = {
  en: {
    eyebrow: 'CULTIVATION MASTER–APPRENTICE AGENT',
    title: 'CMAA workspace',
    subtitle: 'A Master-guided system for eliciting, testing, and preserving Composite Crop-State Indicator knowledge.',
    prototype: 'Interaction prototype',
    private: 'No raw CEA data exposed',
    workflow: 'Workflow', case: 'Case', contextLabel: 'Context', windowLabel: 'Window', statusLabel: 'Status', global: 'Global', local: 'Local', globalStatus: 'Source registry pending', localStatus: 'Data-feasibility review', archive: 'Archive', chat: 'Master dialogue', evidence: 'Evidence packet', records: 'Saved review outputs',
    stage1: 'Master-first', stage2: 'Structure', stage3: 'Challenge', stage4: 'Boundary', stage5: 'Specification', stage6: 'Provenance',
    caseTitle: 'Selected case episode', context: 'Strawberry · greenhouse 2', window: 'Pre-anchor evidence window', qc: 'QC-aware',
    chatTitle: 'Start with the Master’s own judgement', chatDesc: 'CMAA does not reveal an indicator candidate until the Master records an independent interpretation.',
    quick: 'Ask CMAA', placeholder: 'Type the Master observation, question, or correction…', send: 'Send',
    candidate: 'Candidate relation', candidateName: 'Vegetative support ↔ reproductive load', candidateDesc: 'A hypothesis seed only. It is not an approved indicator, threshold, diagnosis, or action recommendation.',
    decision: 'Master review decision', retain: 'Retain', revise: 'Revise', split: 'Split', merge: 'Merge', reject: 'Reject', defer: 'Defer',
    save: 'Save structured review', saved: 'Saved locally', clear: 'Clear local records', noRecords: 'No saved outputs yet',
    evidenceTitle: 'Available evidence', image: 'Image evidence', imageDesc: 'AM/PM × left/right retained separately', environment: 'Environment + actuator', environmentDesc: 'Time-aligned context', root: 'Root zone', rootDesc: 'Moisture · EC · substrate temperature', growth: 'Growth observations', growthDesc: 'Flower, fruit, and vegetative measurements', harvest: 'Harvest + quality', harvestDesc: 'Follow-up outcome only',
    systemNote: 'This prototype keeps evidence modalities, review decisions, and saved outputs separate. Live 2222 runner and append-only provenance will be connected next.',
    prompt1: 'What do you notice first in this case?', prompt2: 'Which observations must be interpreted together?', prompt3: 'What would make you revise this judgement?',
    welcome: 'I am ready to capture the Master-first interpretation. Begin with what you notice before naming a cause, indicator, or action.',
    acknowledgement: 'Captured. I will preserve this as Master language first, then ask for comparison context, conditions, and recheck criteria before showing any candidate.',
    recordTitle: 'Review output', recordDraft: 'Draft review', savedLabel: 'Saved', decisionRequired: 'Choose a decision before saving the structured review.',
    language: 'KOR'
  },
  ko: {
    eyebrow: 'CULTIVATION MASTER–APPRENTICE AGENT',
    title: 'CMAA 워크스페이스',
    subtitle: 'Master 지식에서 복합 작물상태지표를 유도·검토·보존하기 위한 상호작용 시스템',
    prototype: '상호작용 프로토타입', private: '원본 CEA 데이터 비노출',
    workflow: '워크플로우', case: '사례', contextLabel: '맥락', windowLabel: '관측창', statusLabel: '상태', global: '글로벌', local: '현장', globalStatus: '출처 registry 연결 예정', localStatus: '데이터 가능성 검토', archive: '기록 보관함', chat: 'Master 대화', evidence: '근거 패킷', records: '저장된 검토 결과',
    stage1: 'Master 우선', stage2: '구조화', stage3: '후보 검토', stage4: '경계 검토', stage5: '정의서', stage6: '근거 이력',
    caseTitle: '선택된 사례 에피소드', context: '딸기 · 2동', window: '판단시점 이전 evidence window', qc: 'QC 고려',
    chatTitle: 'Master의 독립 판단부터 기록', chatDesc: 'Master가 독립적으로 해석을 기록하기 전에는 CMAA가 지표 후보를 제시하지 않음',
    quick: 'CMAA에 질문', placeholder: 'Master 관찰, 질문 또는 수정 의견을 입력…', send: '전송',
    candidate: '지표 후보 관계', candidateName: '영양생장 지지 ↔ 생식부하', candidateDesc: '단지 가설 시드임. 승인된 지표·임계값·진단·행동 추천이 아님',
    decision: 'Master 검토 결정', retain: '유지', revise: '수정', split: '분리', merge: '병합', reject: '거부', defer: '보류',
    save: '구조화 검토 저장', saved: '로컬 저장됨', clear: '로컬 기록 삭제', noRecords: '저장된 결과 없음',
    evidenceTitle: '이용 가능한 근거', image: '이미지 근거', imageDesc: 'AM/PM × left/right을 분리 보존', environment: '환경 + 구동기', environmentDesc: '시간 정렬 맥락', root: '근권', rootDesc: '함수율 · EC · 배지온도', growth: '생육 관측', growthDesc: '화방·과실·영양생장 측정값', harvest: '수확 + 품질', harvestDesc: '후속 outcome만 사용',
    systemNote: '이 프로토타입은 evidence modality, 검토 결정, 저장 결과를 분리 보존함. 이후 live 2222 runner와 append-only provenance를 연결함',
    prompt1: '이 사례에서 가장 먼저 무엇을 보나요?', prompt2: '어떤 관측값을 함께 해석해야 하나요?', prompt3: '어떤 조건에서 현재 판단을 수정하나요?',
    welcome: 'Master 우선 판단을 기록할 준비가 되었습니다. 원인·지표·행동을 이름 붙이기 전에 먼저 무엇이 보이는지부터 말씀해 주세요.',
    acknowledgement: '기록했습니다. 먼저 Master의 현장 언어를 보존하고, 후보를 보이기 전에 비교 맥락·조건·재확인 기준을 확인하겠습니다.',
    recordTitle: '검토 결과', recordDraft: '검토 초안', savedLabel: '저장됨', decisionRequired: '구조화 검토를 저장하려면 결정을 선택하세요.',
    language: 'ENG'
  }
} as const;

const stages = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'] as const;

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [stage, setStage] = useState(0);
  const [draft, setDraft] = useState('');
  const [lastMasterNote, setLastMasterNote] = useState('');
  const [decision, setDecision] = useState<Decision>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [notice, setNotice] = useState('');
  const t = copy[lang];

  useEffect(() => {
    const storedLang = window.localStorage.getItem('cmaa-lang') as Lang | null;
    const storedRecords = window.localStorage.getItem('cmaa-review-records');
    if (storedLang === 'ko' || storedLang === 'en') setLang(storedLang);
    if (storedRecords) { try { setRecords(JSON.parse(storedRecords)); } catch { /* ignore malformed local data */ } }
  }, []);
  useEffect(() => { window.localStorage.setItem('cmaa-lang', lang); }, [lang]);
  useEffect(() => { window.localStorage.setItem('cmaa-review-records', JSON.stringify(records)); }, [records]);
  useEffect(() => { setMessages([{ id: 'welcome', role: 'assistant', text: t.welcome }]); }, [lang]);

  const recordSummary = useMemo(() => lastMasterNote.trim() || '—', [lastMasterNote]);
  const addPrompt = (prompt: string) => setMessages((items) => [...items, { id: crypto.randomUUID(), role: 'master', text: prompt }, { id: crypto.randomUUID(), role: 'assistant', text: t.acknowledgement }]);
  const submit = (event: FormEvent) => { event.preventDefault(); const text = draft.trim(); if (!text) return; setLastMasterNote(text); addPrompt(text); setDraft(''); };
  const saveRecord = () => {
    if (!decision) { setNotice(t.decisionRequired); return; }
    setRecords((items) => [{ id: crypto.randomUUID(), time: new Date().toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-GB'), decision, note: recordSummary }, ...items]);
    setNotice(t.saved); setStage(5);
  };

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><span className="seed">✦</span><span>CMAA</span><small>Master–Apprentice workspace</small></div>
      <div className="top-actions"><span className="status-dot">{t.prototype}</span><button className="language" onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}>{t.language}</button></div>
    </header>

    <section className="intro">
      <div><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="subtitle">{t.subtitle}</p></div>
      <div className="intro-note"><b>{t.private}</b><span>{t.systemNote}</span></div>
    </section>

    <nav className="steps" aria-label={t.workflow}>{stages.map((key, index) => <button key={key} onClick={() => setStage(index)} className={stage === index ? 'active' : index < stage ? 'done' : ''}><span>0{index + 1}</span><b>{t[key]}</b></button>)}</nav>

    <section className="case-strip"><div><span>{t.case.toUpperCase()}</span><b>{t.caseTitle}</b></div><div><span>{t.contextLabel.toUpperCase()}</span><b>{t.context}</b></div><div><span>{t.windowLabel.toUpperCase()}</span><b>{t.window}</b></div><div><span>{t.statusLabel.toUpperCase()}</span><b className="good">{t.qc}</b></div></section>

    <section className="workspace">
      <aside className="side evidence"><div className="section-label">{t.evidence}</div><h2>{t.evidenceTitle}</h2>
        {[[t.environment,t.environmentDesc],[t.root,t.rootDesc],[t.growth,t.growthDesc],[t.image,t.imageDesc],[t.harvest,t.harvestDesc]].map(([name, desc], i) => <div className="evidence-row" key={name}><span>{String(i + 1).padStart(2,'0')}</span><div><b>{name}</b><small>{desc}</small></div></div>)}
        <p className="guard">{t.private} · raw files remain outside Vercel</p>
      </aside>

      <section className="center">
        <div className="chat-head"><div><p className="section-label">{t.chat}</p><h2>{t.chatTitle}</h2><p>{t.chatDesc}</p></div><span className="stage-pill">{t[stages[stage]]}</span></div>
        <div className="quick"><span>{t.quick}</span><button onClick={() => addPrompt(t.prompt1)}>{t.prompt1}</button><button onClick={() => addPrompt(t.prompt2)}>{t.prompt2}</button><button onClick={() => addPrompt(t.prompt3)}>{t.prompt3}</button></div>
        <div className="messages">{messages.map((message) => <article key={message.id} className={`message ${message.role}`}><span>{message.role === 'assistant' ? 'CMAA' : 'MASTER'}</span><p>{message.text}</p></article>)}</div>
        <form className="composer" onSubmit={submit}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.placeholder} rows={3}/><button type="submit">{t.send} <span>↗</span></button></form>
      </section>

      <aside className="side review"><div className="section-label">{t.candidate}</div><h2>{t.candidateName}</h2><p>{t.candidateDesc}</p><div className="candidate-meta"><span>{t.global}</span><b>{t.globalStatus}</b><span>{t.local}</span><b>{t.localStatus}</b></div>
        <label>{t.decision}</label><div className="decision-grid">{(['retain','revise','split','merge','reject','defer'] as const).map((item) => <button key={item} className={decision === item ? 'selected' : ''} onClick={() => setDecision(item)}>{t[item]}</button>)}</div>
        <button className="save" onClick={saveRecord}>{t.save}</button>{notice && <p className="notice">{notice}</p>}
        <div className="review-output"><span>{t.recordTitle}</span><p>{recordSummary}</p></div>
      </aside>
    </section>

    <section className="records"><div className="records-heading"><div><p className="section-label">{t.archive}</p><h2>{t.records}</h2></div>{records.length > 0 && <button onClick={() => setRecords([])}>{t.clear}</button>}</div>{records.length === 0 ? <div className="empty">{t.noRecords}</div> : <div className="record-list">{records.map((record) => <article key={record.id}><span>{t.savedLabel} · {record.time}</span><b>{t[record.decision as Exclude<Decision, ''>]}</b><p>{record.note}</p></article>)}</div>}</section>
  </main>;
}

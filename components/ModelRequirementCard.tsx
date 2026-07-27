'use client';

type CandidateId = 'VRBI' | 'IFLI' | 'FSMSI';
const cards: Record<CandidateId, { measurement: string; models: string[]; annotations: string[]; gate: string; warning: string }> = {
  VRBI: { measurement: 'Direct field measurement primary; vision is observation support only.', models: ['Optional YOLO / RT-DETR detector', 'Optional SAM 2 segmentation'], annotations: ['plant/truss identity', 'manual leaf, flower, and fruit-set counts'], gate: 'Repeated plant × linked-truss observations', warning: 'Do not substitute image proxy for manual plant-level linkage.' },
  IFLI: { measurement: 'Mixed direct observation and image-derived proxy.', models: ['Truss + fruit detector', 'SAM 2 instance segmentation', 'Occlusion QC'], annotations: ['truss box', 'fruit mask', 'fruit position', 'manual linked count'], gate: 'Linked truss–harvest and proxy validation', warning: 'Visible count is not actual fruit count under occlusion.' },
  FSMSI: { measurement: 'Image-derived proxy for same-fruit size–maturity synchrony.', models: ['YOLO / RT-DETR', 'SAM 2', 'ByteTrack / BoT-SORT', 'EfficientNetV2 / ConvNeXt / ViT maturity classifier'], annotations: ['fruit box/mask', 'maturity class', 'plant/truss/fruit identity', 'repeated image + linked harvest'], gate: 'Calibration and same-fruit linkage', warning: 'Mask area is not fruit weight or volume; maturity probability is not confirmed maturity.' },
};

export function ModelRequirementCard({ candidateId, lang }: { candidateId: CandidateId; lang: 'en' | 'ko' }) {
  const card = cards[candidateId];
  const ko = lang === 'ko';
  return <article className="model-requirement-card"><span>{ko ? '이미지 측정 및 모델 요건' : 'Image Measurement & Model Requirement'}</span><h3>{candidateId}</h3><p><b>{ko ? '측정 경계: ' : 'Measurement boundary: '}</b>{card.measurement}</p><b>{ko ? '초기 benchmark 모델' : 'Initial benchmark models'}</b><ul>{card.models.map((item) => <li key={item}>{item}</li>)}</ul><b>{ko ? '필수 annotation' : 'Required annotation'}</b><ul>{card.annotations.map((item) => <li key={item}>{item}</li>)}</ul><p><b>{ko ? 'Formula gate: ' : 'Formula gate: '}</b>{card.gate}</p><p className="studio-error">{card.warning}</p></article>;
}

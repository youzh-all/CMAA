import { NextResponse } from 'next/server';

type Message = { role: 'user' | 'assistant'; content: string };

const bridgeUrl = process.env.CMAA_CANDIDATE_API_URL || process.env.CMAA_REVIEW_QUEUE_URL?.replace(/\/v1\/cmaa\/review-draft-events\/?$/, '');
const bridgeToken = process.env.CMAA_CANDIDATE_API_TOKEN || process.env.CMAA_REVIEW_QUEUE_TOKEN;

function displayMessage(review: Record<string, unknown>) {
  const text = (key: string) => typeof review[key] === 'string' ? review[key] : '';
  const list = (key: string) => Array.isArray(review[key]) ? review[key].filter((item): item is string => typeof item === 'string').join('; ') : '';
  return [text('observation'), text('interpretation'), list('exceptions') ? `Exception: ${list('exceptions')}` : '', list('recheck') ? `Recheck: ${list('recheck')}` : '', list('missing_linkage') ? `Missing linkage: ${list('missing_linkage')}` : '', list('uncertainty') ? `Uncertainty: ${list('uncertainty')}` : ''].filter(Boolean).join('\n\n');
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages.filter((item: unknown): item is Message => !!item && typeof (item as Message).content === 'string' && ['user', 'assistant'].includes((item as Message).role)) : [];
  const masterNote = [...messages].reverse().find((message) => message.role === 'user')?.content.trim() || '';
  if (!masterNote || masterNote.length > 5000) return NextResponse.json({ error: 'A Master observation is required.' }, { status: 400 });
  if (!bridgeUrl || !bridgeToken) return NextResponse.json({ error: 'Server-side CMAA dialogue is not configured.', code: 'server_dialogue_not_configured' }, { status: 503 });
  try {
    const response = await fetch(`${bridgeUrl.replace(/\/$/, '')}/v1/cmaa/dialogue/reflect`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bridgeToken}` },
      body: JSON.stringify({ case_id: 'B2-20251211', master_note: masterNote }), cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json(payload, { status: response.status });
    return NextResponse.json({ message: displayMessage(payload.review || {}), structuredReview: payload.review, validation: payload.validation, boundaries: ['No score or autonomous recommendation.', 'Master and researcher approval are required.'] });
  } catch {
    return NextResponse.json({ error: 'Server-side CMAA dialogue is unavailable.', code: 'server_dialogue_unavailable' }, { status: 502 });
  }
}

import { NextResponse } from 'next/server';

const candidateApiUrl = process.env.CMAA_CANDIDATE_API_URL || process.env.CMAA_REVIEW_QUEUE_URL?.replace(/\/v1\/cmaa\/review-draft-events\/?$/, '');
const candidateApiToken = process.env.CMAA_CANDIDATE_API_TOKEN || process.env.CMAA_REVIEW_QUEUE_TOKEN;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const caseId = typeof body.caseId === 'string' ? body.caseId : 'B2-20251211';
  const masterCue = typeof body.masterCue === 'string' ? body.masterCue.trim() : '';
  if (!masterCue || masterCue.length > 5000) return NextResponse.json({ error: 'A Master cue is required.' }, { status: 400 });
  if (!candidateApiUrl || !candidateApiToken) return NextResponse.json({ error: 'Candidate bridge is not configured.', code: 'candidate_bridge_not_configured' }, { status: 503 });
  try {
    const response = await fetch(`${candidateApiUrl.replace(/\/$/, '')}/v1/cmaa/candidates/propose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateApiToken}` },
      body: JSON.stringify({ case_id: caseId, master_cue: masterCue }),
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Candidate bridge is unavailable.', code: 'candidate_bridge_unavailable' }, { status: 502 });
  }
}

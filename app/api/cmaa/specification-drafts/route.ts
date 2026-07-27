import { NextResponse } from 'next/server';

const candidateApiUrl = process.env.CMAA_CANDIDATE_API_URL;
const candidateApiToken = process.env.CMAA_CANDIDATE_API_TOKEN || process.env.CMAA_REVIEW_QUEUE_TOKEN;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const candidateId = typeof body.candidateId === 'string' ? body.candidateId : '';
  const selectedComponents = Array.isArray(body.selectedComponents) ? body.selectedComponents.filter((item: unknown): item is string => typeof item === 'string') : [];
  if (!candidateId) return NextResponse.json({ error: 'A candidate ID is required.' }, { status: 400 });
  if (!candidateApiUrl || !candidateApiToken) return NextResponse.json({ error: 'Candidate bridge is not configured.', code: 'candidate_bridge_not_configured' }, { status: 503 });
  try {
    const response = await fetch(`${candidateApiUrl.replace(/\/$/, '')}/v1/cmaa/specifications/draft`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateApiToken}` },
      body: JSON.stringify({ candidate_id: candidateId, selected_components: selectedComponents }), cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Candidate bridge is unavailable.', code: 'candidate_bridge_unavailable' }, { status: 502 });
  }
}

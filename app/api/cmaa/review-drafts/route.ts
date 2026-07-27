import { NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';

const decisions = new Set(['retain', 'revise', 'split', 'merge', 'reject', 'defer']);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const decision = typeof body.decision === 'string' ? body.decision : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const caseId = typeof body.caseId === 'string' ? body.caseId : 'b2-20251211';
  const reviewerRole = body.reviewerRole === 'grower' ? 'grower' : 'master';
  if (!decisions.has(decision) || !note || note.length > 5000) return NextResponse.json({ error: 'A valid decision and review note are required.' }, { status: 400 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Review draft storage is not configured. Add BLOB_READ_WRITE_TOKEN to Vercel.', code: 'review_storage_not_configured' }, { status: 503 });
  const record = { id: crypto.randomUUID(), status: 'draft', caseId, reviewerRole, decision, note, createdAt: new Date().toISOString(), schemaVersion: 'cmaa-review-draft-v1', governance: 'draft only; researcher adjudication required before ledger ingestion' };
  const blob = await put(`cmaa/review-drafts/${caseId}/${record.createdAt}-${record.id}.json`, JSON.stringify(record, null, 2), { access: 'private', contentType: 'application/json', addRandomSuffix: false });
  let handoff: { status: string; detail?: string } = { status: 'not_configured' };
  if (process.env.CMAA_REVIEW_QUEUE_URL && process.env.CMAA_REVIEW_QUEUE_TOKEN) {
    try {
      const queueResponse = await fetch(process.env.CMAA_REVIEW_QUEUE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CMAA_REVIEW_QUEUE_TOKEN}` }, body: JSON.stringify({ draft: record, source: { storage: 'vercel_blob_private', blobUrl: blob.url } }) });
      handoff = queueResponse.ok ? { status: 'queued' } : { status: 'queue_delivery_failed', detail: String(queueResponse.status) };
    } catch { handoff = { status: 'queue_delivery_failed' }; }
  }
  return NextResponse.json({ id: record.id, status: record.status, createdAt: record.createdAt, storage: 'vercel_blob_private', handoff });
}

export async function GET(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: 'Review draft storage is not configured.', code: 'review_storage_not_configured', drafts: [] }, { status: 503 });
  const caseId = new URL(request.url).searchParams.get('caseId') || 'b2-20251211';
  const result = await list({ prefix: `cmaa/review-drafts/${caseId}/`, limit: 50 });
  const drafts = await Promise.all(result.blobs.map(async (blob) => {
    try { const response = await fetch(blob.url, { cache: 'no-store' }); const item = await response.json(); return { id: item.id, status: item.status, decision: item.decision, reviewerRole: item.reviewerRole, createdAt: item.createdAt, caseId: item.caseId }; }
    catch { return null; }
  }));
  return NextResponse.json({ caseId, storage: 'vercel_blob_private', drafts: drafts.filter(Boolean).sort((a, b) => String(b?.createdAt).localeCompare(String(a?.createdAt))) });
}

import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

type Message = { role: 'user' | 'assistant'; content: string };

const SYSTEM_PROMPT = `You are CMAA, a Cultivation Master–Apprentice Agent. You assist a strawberry grower/Master by discussing the evidence packet first. Preserve the following boundaries: do not issue autonomous cultivation commands, do not present a status score, do not invent unavailable plant–truss–fruit linkage, and distinguish direct measurement, proxy, context, follow-up outcome, and not-observable. Ask concise evidence-aware follow-up questions. A Master/grower remains the decision maker.`;

async function caseContext() {
  const file = path.join(process.cwd(), 'public', 'case-assets', 'b2-20251211', 'case_packet.json');
  const packet = JSON.parse(await readFile(file, 'utf8'));
  return JSON.stringify({
    case: { greenhouse_id: packet.greenhouse_id, anchor_date_local: packet.anchor_date_local },
    sensor_day_summary: packet.sensor_day_summary,
    growth_observation_date: packet.growth_observation_date,
    growth_summary: packet.growth_summary,
    harvest_date: packet.harvest_date,
    harvest_summary: packet.harvest_summary,
    evidence_boundary: 'Images are separate AM/PM × left/right views; visible structures are not whole-plant ground truth. Harvest is follow-up outcome only.'
  });
}

export async function POST(request: Request) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ error: 'CMAA chat is not configured.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const messages = Array.isArray(body.messages) ? body.messages.slice(-8).filter((m: unknown): m is Message => !!m && typeof (m as Message).content === 'string' && ['user', 'assistant'].includes((m as Message).role)) : [];
  if (!messages.length) return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
  const staticContext = await caseContext();
  const models = [process.env.OPENROUTER_MODEL, process.env.OPENROUTER_FALLBACK_MODEL].filter(Boolean) as string[];
  let lastError = 'OpenRouter request failed.';
  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://cmaa-blond.vercel.app', 'X-Title': process.env.OPENROUTER_APP_NAME || 'CMAA' },
        body: JSON.stringify({ model, temperature: 0.2, max_tokens: 1200, reasoning: { effort: 'low' }, messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: `Stable case context (reuse unchanged for prompt-cache-friendly prefix): ${staticContext}` },
          ...messages
        ] })
      });
      if (!response.ok) { lastError = `OpenRouter model ${model}: ${response.status}`; continue; }
      const data = await response.json();
      return NextResponse.json({ message: data.choices?.[0]?.message?.content || '', model, usage: data.usage || null, boundaries: ['No score or autonomous recommendation.', 'Master/grower approval is required.'] });
    } catch { lastError = `OpenRouter model ${model} unavailable.`; }
  }
  return NextResponse.json({ error: lastError }, { status: 502 });
}

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Schema } from '../../data/resource';

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? 'global.anthropic.claude-opus-4-8';
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET!;

const bedrock = new BedrockRuntimeClient({ region: REGION });
const s3 = new S3Client({ region: REGION });

const mediaTypeFor = (key: string): string => {
  const k = key.toLowerCase();
  if (k.endsWith('.png')) return 'image/png';
  if (k.endsWith('.webp')) return 'image/webp';
  if (k.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
};

const streamToBase64 = async (body: unknown): Promise<string> => {
  const chunks: Buffer[] = [];
  // @ts-expect-error async iterable stream
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('base64');
};

const fetchImage = async (key: string) => {
  const obj = await s3.send(
    new GetObjectCommand({ Bucket: PHOTOS_BUCKET, Key: key })
  );
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: mediaTypeFor(key),
      data: await streamToBase64(obj.Body),
    },
  };
};

const SOLO_PROMPT = `You are a fitness coach assistant. Estimate body composition from this full-body photo for PERSONAL progress tracking only (not medical advice).

Respond with ONLY a JSON object, no prose:
{
  "bodyFatPct": <number, best single estimate of body fat percentage, or null>,
  "summary": "<2-3 sentence encouraging, honest summary of visible composition and posture>",
  "estimatedWeightNote": "<short note about apparent muscularity/leanness; do NOT guess exact kg>"
}
If it's not a clear full-body photo of a person, set bodyFatPct null and explain in summary.`;

const COMPARE_PROMPT = `You are a fitness coach assistant for PERSONAL progress tracking (not medical advice). Image 1 is the person's BASELINE (first) progress photo. Image 2 is their LATEST photo.

Respond with ONLY a JSON object, no prose:
{
  "bodyFatPct": <number, best single estimate of body fat % from the LATEST photo (image 2), or null>,
  "summary": "<2-3 sentence honest, encouraging read of the latest photo>",
  "estimatedWeightNote": "<short note on apparent muscularity/leanness; do NOT guess exact kg>",
  "comparison": "<3-4 sentences honestly comparing latest vs baseline: what visibly IMPROVED (leanness, muscle, posture, definition) and what has NOT changed yet. If there's no clear visible change, say so kindly and honestly. Be specific but supportive.>"
}
If either image isn't a clear full-body person photo, set bodyFatPct null and explain in summary.`;

export const handler: Schema['analyzeCheckIn']['functionHandler'] = async (
  event
) => {
  const photoPath = event.arguments.photoPath;
  if (!photoPath) throw new Error('photoPath is required');
  const baselinePath = event.arguments.baselinePhotoPath || null;

  // Build the message content: [baseline?, current, prompt].
  const content: unknown[] = [];
  if (baselinePath && baselinePath !== photoPath) {
    content.push(await fetchImage(baselinePath));
  }
  content.push(await fetchImage(photoPath));
  const comparing = content.length === 2;
  content.push({ type: 'text', text: comparing ? COMPARE_PROMPT : SOLO_PROMPT });

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: [{ role: 'user', content }],
      }),
    })
  );

  const decoded = JSON.parse(new TextDecoder().decode(res.body));
  const text: string = decoded?.content?.[0]?.text ?? '';

  let parsed: {
    bodyFatPct?: number;
    summary?: string;
    estimatedWeightNote?: string;
    comparison?: string;
  } = {};
  try {
    parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch {
    parsed = { summary: text || 'Could not parse model response.' };
  }

  return {
    bodyFatPct: typeof parsed.bodyFatPct === 'number' ? parsed.bodyFatPct : null,
    summary: parsed.summary ?? null,
    estimatedWeightNote: parsed.estimatedWeightNote ?? null,
    comparison: comparing ? parsed.comparison ?? null : null,
    raw: JSON.stringify({ model: MODEL_ID, compared: comparing, text }),
  };
};

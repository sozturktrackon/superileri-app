import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Schema } from '../../data/resource';

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? 'global.anthropic.claude-sonnet-5';
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET!;
const MAX_IMAGES_PER_SET = 4; // front/back/left/right

type AnglePhoto = { angle: string; path: string };

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

const label = (a: AnglePhoto) => a.angle.charAt(0).toUpperCase() + a.angle.slice(1);

/** Fetch a labeled set of angle photos as [text-label, image, text-label, image, ...]. */
const buildLabeledImages = async (photos: AnglePhoto[], setName: string) => {
  const blocks: unknown[] = [];
  for (const p of photos.slice(0, MAX_IMAGES_PER_SET)) {
    blocks.push({ type: 'text', text: `${setName} - ${label(p)} view:` });
    blocks.push(await fetchImage(p.path));
  }
  return blocks;
};

const SOLO_PROMPT = `You are a fitness coach assistant. You are given one or more full-body photos of the SAME person taken at the same time, from different angles (front, back, left side, and/or right side), each labeled. Use all provided angles together to make ONE combined, honest assessment for PERSONAL progress tracking only (not medical advice).

Respond with ONLY a JSON object, no prose:
{
  "bodyFatPct": <number, best single estimate of body fat percentage using all angles together, or null>,
  "summary": "<2-3 sentence encouraging, honest summary of visible composition and posture, drawing on whichever angles were provided>",
  "estimatedWeightNote": "<short note about apparent muscularity/leanness; do NOT guess exact kg>"
}
If none of the images are a clear full-body photo of a person, set bodyFatPct null and explain in summary.`;

const COMPARE_PROMPT = `You are a fitness coach assistant for PERSONAL progress tracking (not medical advice). You are given TWO labeled sets of full-body photos of the same person: a BASELINE set (their first check-in) and a LATEST set (today), each with one or more angles (front, back, left side, right side). Where the same angle exists in both sets, compare it directly; use whatever angles are available.

Respond with ONLY a JSON object, no prose:
{
  "bodyFatPct": <number, best single estimate of body fat % from the LATEST set using all its angles together, or null>,
  "summary": "<2-3 sentence honest, encouraging read of the latest photos>",
  "estimatedWeightNote": "<short note on apparent muscularity/leanness; do NOT guess exact kg>",
  "comparison": "<3-5 sentences honestly comparing latest vs baseline across the available angles: what visibly IMPROVED (leanness, muscle, posture, definition, front AND back/side if provided) and what has NOT changed yet. If there's no clear visible change, say so kindly and honestly. Be specific but supportive.>"
}
If the images aren't clear full-body person photos, set bodyFatPct null and explain in summary.`;

export const handler: Schema['analyzeCheckIn']['functionHandler'] = async (
  event
) => {
  const photos = (event.arguments.photos ?? []) as AnglePhoto[];
  if (!Array.isArray(photos) || photos.length === 0) {
    throw new Error('At least one photo is required');
  }
  const baselinePhotos = (event.arguments.baselinePhotos ?? null) as
    | AnglePhoto[]
    | null;

  const hasBaseline =
    Array.isArray(baselinePhotos) &&
    baselinePhotos.length > 0 &&
    baselinePhotos.some(
      (b) => !photos.some((p) => p.path === b.path) // ignore if it's literally the same set
    );

  const content: unknown[] = [];
  if (hasBaseline) {
    content.push(...(await buildLabeledImages(baselinePhotos!, 'BASELINE')));
    content.push(...(await buildLabeledImages(photos, 'LATEST')));
    content.push({ type: 'text', text: COMPARE_PROMPT });
  } else {
    content.push(...(await buildLabeledImages(photos, 'PHOTO')));
    content.push({ type: 'text', text: SOLO_PROMPT });
  }

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1200,
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
    comparison: hasBaseline ? parsed.comparison ?? null : null,
    raw: JSON.stringify({ model: MODEL_ID, compared: hasBaseline, text }),
  };
};

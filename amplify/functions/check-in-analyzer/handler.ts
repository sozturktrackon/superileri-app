import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Schema } from '../../data/resource';

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
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
  // Node 18+ stream -> Buffer
  const chunks: Buffer[] = [];
  // @ts-expect-error async iterable stream
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('base64');
};

const PROMPT = `You are a fitness coach assistant. Estimate body composition from this full-body photo for the person's PERSONAL progress tracking only (not medical advice).

Respond with ONLY a JSON object, no prose, in exactly this shape:
{
  "bodyFatPct": <number, your best single estimate of body fat percentage>,
  "summary": "<2-3 sentence encouraging, honest summary of visible composition and posture>",
  "estimatedWeightNote": "<short note about apparent muscularity/leanness; do NOT guess exact kg>"
}

If the image is not a clear full-body photo of a person, return bodyFatPct: null and explain briefly in summary.`;

export const handler: Schema['analyzeCheckIn']['functionHandler'] = async (
  event
) => {
  const photoPath = event.arguments.photoPath;
  if (!photoPath) throw new Error('photoPath is required');

  const obj = await s3.send(
    new GetObjectCommand({ Bucket: PHOTOS_BUCKET, Key: photoPath })
  );
  const imageBase64 = await streamToBase64(obj.Body);

  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaTypeFor(photoPath),
              data: imageBase64,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  };

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    })
  );

  const decoded = JSON.parse(new TextDecoder().decode(res.body));
  const text: string = decoded?.content?.[0]?.text ?? '';

  let parsed: { bodyFatPct?: number; summary?: string; estimatedWeightNote?: string } = {};
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    parsed = { summary: text || 'Could not parse model response.' };
  }

  return {
    bodyFatPct: typeof parsed.bodyFatPct === 'number' ? parsed.bodyFatPct : null,
    summary: parsed.summary ?? null,
    estimatedWeightNote: parsed.estimatedWeightNote ?? null,
    raw: JSON.stringify({ model: MODEL_ID, text }),
  };
};

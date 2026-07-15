import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient();
const MODEL_ID = process.env.COACH_MODEL_ID || 'global.anthropic.claude-sonnet-5';

type Args = {
  language?: string; // human-readable, e.g. 'Turkish'
  name?: string;
  dayNumber?: number;
  cycle?: number;
  streak?: number;
  totalCircuits?: number;
  isRest?: boolean;
  groups?: string; // today's circuit names, comma-joined (already localized)
};

/**
 * One warm, grounded coaching line for the Today screen. Guardrails matter
 * more than flair here: never guilt, never medical claims, never hype-speak;
 * short enough to read in two seconds.
 */
export const handler = async (event: { arguments: Args }) => {
  const a = event.arguments || {};
  const language = a.language || 'English';

  const context = [
    a.name ? `User's first name: ${a.name}` : null,
    `Program day ${a.dayNumber ?? '?'}${(a.cycle ?? 1) > 1 ? `, cycle ${a.cycle}` : ''}`,
    a.isRest ? 'Today is a REST day' : `Today's circuits: ${a.groups || 'workout'}`,
    `Current streak: ${a.streak ?? 0} training days`,
    `Lifetime circuits completed: ${a.totalCircuits ?? 0}`,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `You write ONE short daily coaching line (1-2 sentences, max ~160 characters) for a home-workout app user, in ${language}.

${context}

Rules:
- Sound like a calm, seasoned coach who knows this person: specific to today's context, never generic fortune-cookie.
- Warm and encouraging, zero guilt, zero hype-speak, no exclamation spam (one "!" max), no emojis, no em dashes.
- On rest days: endorse the rest, never suggest training.
- Never give medical or nutrition advice. Never mention being an AI.
- Write ONLY the line itself in ${language}, nothing else.`;

  try {
    const res = await client.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 120 },
      })
    );
    const text = res.output?.message?.content?.[0]?.text?.trim() ?? '';
    // Defensive: strip wrapping quotes some models add.
    return text.replace(/^["'“‘]+|["'”’]+$/g, '');
  } catch (e) {
    console.error('coach line failed', e);
    return ''; // client shows nothing; the app never blocks on this
  }
};

// ─────────────────────────────────────────────────────────────
// Item identification from a photo — Claude (multimodal) on Amazon Bedrock.
// Photo in → {title, brand, category, condition} out. The category it returns
// is the relational filter for the pgvector comparable search downstream.
// ─────────────────────────────────────────────────────────────
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION,
});
const LLM_MODEL_ID = process.env.BEDROCK_LLM_MODEL_ID ?? 'anthropic.claude-sonnet-4-6';

// Categories we keep comparables for — keep vision output on this controlled list
// so it lines up with sold_comparables.category.
export const CATEGORIES = [
  'sneakers',
  'handbags',
  'apparel',
  'watches',
  'electronics',
  'home',
  'toys',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface Identification {
  title: string;
  brand: string | null;
  category: Category;
  condition: Condition;
  caption: string; // compact brand+model+colour text to sharpen the embedding
}

/** Identify an item from a base64 image (jpeg/png). */
export async function identifyItem(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' = 'image/jpeg'
): Promise<Identification> {
  const prompt = `You are a resale cataloguer. Identify the single main item in this photo for a secondhand marketplace listing.

Return STRICT JSON only (no markdown), with this exact shape:
{
  "title": "concise listing title a seller would use, e.g. 'Nike Air Jordan 1 Retro High OG Chicago'",
  "brand": "brand name or null if unknown",
  "category": one of ${JSON.stringify(CATEGORIES)},
  "condition": one of ["new","like_new","good","fair","poor"] (judge from visible wear),
  "caption": "5-12 word phrase capturing brand, model, colourway, key attributes"
}`;

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: LLM_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 400,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: stripDataUrl(imageBase64) },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    })
  );

  const envelope = JSON.parse(new TextDecoder().decode(res.body)) as {
    content?: { text: string }[];
  };
  const raw = parseJsonLoose(envelope.content?.[0]?.text ?? '{}');

  const category = (CATEGORIES as readonly string[]).includes(raw.category as string)
    ? (raw.category as Category)
    : 'other';
  const condition = (['new', 'like_new', 'good', 'fair', 'poor'] as string[]).includes(
    raw.condition as string
  )
    ? (raw.condition as Condition)
    : 'good';

  return {
    title: raw.title?.trim() || 'Unidentified item',
    brand: raw.brand?.trim() || null,
    category,
    condition,
    caption: raw.caption?.trim() || raw.title?.trim() || 'secondhand item',
  };
}

interface RawId {
  title?: string;
  brand?: string;
  category?: string;
  condition?: string;
  caption?: string;
}

function parseJsonLoose(text: string): RawId {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fall through */
      }
    }
    return {};
  }
}

function stripDataUrl(b64: string): string {
  const comma = b64.indexOf(',');
  return b64.startsWith('data:') && comma !== -1 ? b64.slice(comma + 1) : b64;
}

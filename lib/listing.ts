// ─────────────────────────────────────────────────────────────
// Generate an optimized marketplace listing — Claude on Amazon Bedrock,
// grounded on the velocity-aware valuation so the suggested price and copy
// are consistent with "priced to actually sell".
// ─────────────────────────────────────────────────────────────
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import type { Valuation } from './valuation';

const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION,
});
const LLM_MODEL_ID = process.env.BEDROCK_LLM_MODEL_ID ?? 'anthropic.claude-sonnet-4-6';

export interface GeneratedListing {
  bestPlatform: string;
  title: string;
  description: string;
  suggestedPrice: number;
  estDaysToSell: number;
}

export interface ListingItem {
  title: string;
  brand: string | null;
  category: string;
  condition: string;
}

export async function generateListing(
  item: ListingItem,
  valuation: Valuation
): Promise<GeneratedListing> {
  const prompt = `You are a top-rated reseller writing a listing optimized to SELL FAST at a fair price.

ITEM: ${item.title}
Brand: ${item.brand ?? 'unknown'} | Category: ${item.category} | Condition: ${item.condition}

MARKET DATA (from comparable sold items):
Best platform by velocity: ${valuation.bestPlatform}
Recommended price: $${valuation.recommendedPrice}
Estimated days to sell at that price: ${valuation.estDaysToSell}

Write a listing for ${valuation.bestPlatform}. Return STRICT JSON only (no markdown):
{
  "title": "keyword-rich marketplace title under 80 chars",
  "description": "2-4 short paragraphs: what it is, condition honestly stated, why buy. Plain text, no markdown.",
  "suggestedPrice": ${valuation.recommendedPrice}
}`;

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: LLM_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 700,
        temperature: 0.4,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  );

  const envelope = JSON.parse(new TextDecoder().decode(res.body)) as {
    content?: { text: string }[];
  };
  const out = parseJsonLoose(envelope.content?.[0]?.text ?? '{}');

  return {
    bestPlatform: valuation.bestPlatform,
    title: out.title?.trim() || item.title,
    description: out.description?.trim() || `${item.title}. Condition: ${item.condition}.`,
    suggestedPrice: Number(out.suggestedPrice) || valuation.recommendedPrice,
    estDaysToSell: valuation.estDaysToSell,
  };
}

interface RawListing {
  title?: string;
  description?: string;
  suggestedPrice?: number;
}

function parseJsonLoose(text: string): RawListing {
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

// ─────────────────────────────────────────────────────────────
// Multimodal embeddings via Amazon Bedrock — Titan Multimodal Embeddings G1
// (amazon.titan-embed-image-v1). Image AND text land in the SAME vector space,
// so a scanned PHOTO and a text-described sold comparable are directly
// comparable with cosine distance. This is what makes pgvector pull its weight:
// two photos of the same sneaker match even when their titles don't.
//
// Output is 1024-dim — must match db/schema.sql vector(1024) and EMBED_DIM.
// ─────────────────────────────────────────────────────────────
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// Bedrock region can differ from the Aurora region (AWS_REGION).
const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION,
});
const EMBED_MODEL_ID = process.env.BEDROCK_EMBED_MODEL_ID ?? 'amazon.titan-embed-image-v1';
const EMBED_DIM = Number(process.env.EMBED_DIM ?? 1024);

export interface EmbedInput {
  /** Base64-encoded image bytes (no data-URL prefix). The hero signal. */
  imageBase64?: string;
  /** Optional caption / brand+model text to sharpen the vector. */
  caption?: string;
}

/**
 * Embed an image and/or caption into a normalized 1024-dim vector.
 * At least one of imageBase64 / caption must be provided.
 */
export async function generateMultimodalEmbedding(input: EmbedInput): Promise<number[]> {
  const body: Record<string, unknown> = {
    embeddingConfig: { outputEmbeddingLength: EMBED_DIM },
  };
  if (input.imageBase64) body.inputImage = stripDataUrl(input.imageBase64);
  if (input.caption) body.inputText = input.caption.slice(0, 2000);
  if (!body.inputImage && !body.inputText) {
    throw new Error('generateMultimodalEmbedding: provide imageBase64 and/or caption');
  }

  const res = await bedrock.send(
    new InvokeModelCommand({
      modelId: EMBED_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    })
  );
  const parsed = JSON.parse(new TextDecoder().decode(res.body)) as {
    embedding?: number[];
    message?: string;
  };
  if (!parsed.embedding || parsed.embedding.length !== EMBED_DIM) {
    throw new Error(
      `Embedding dim mismatch: got ${parsed.embedding?.length ?? parsed.message}, expected ${EMBED_DIM}`
    );
  }
  return parsed.embedding;
}

/** Convenience: text-only embedding (used to embed seed comparables by description). */
export function generateTextEmbedding(text: string): Promise<number[]> {
  return generateMultimodalEmbedding({ caption: text });
}

/** Accept either a raw base64 string or a data URL and return just the bytes. */
function stripDataUrl(b64: string): string {
  const comma = b64.indexOf(',');
  return b64.startsWith('data:') && comma !== -1 ? b64.slice(comma + 1) : b64;
}

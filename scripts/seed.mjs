// Seed sold_comparables with Bedrock Titan Multimodal (text) embeddings.
// Usage: node --env-file=.env.local scripts/seed.mjs
//
// We embed each comparable by its descriptive caption. Because Titan Multimodal
// puts text AND images in the same vector space, a photo embedded at scan time
// is directly comparable to these text-embedded comps.
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { COMPARABLES } from '../db/comparables.mjs';
import { createPool } from './db.mjs';

const EMBED_MODEL_ID = process.env.BEDROCK_EMBED_MODEL_ID ?? 'amazon.titan-embed-image-v1';
const EMBED_DIM = Number(process.env.EMBED_DIM ?? 1024);

const bedrock = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embed(text, tries = 6) {
  for (let i = 0; ; i++) {
    try {
      const res = await bedrock.send(
        new InvokeModelCommand({
          modelId: EMBED_MODEL_ID,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            inputText: text.slice(0, 2000),
            embeddingConfig: { outputEmbeddingLength: EMBED_DIM },
          }),
        })
      );
      const parsed = JSON.parse(new TextDecoder().decode(res.body));
      if (!parsed.embedding) throw new Error(parsed.message ?? 'no embedding returned');
      return parsed.embedding;
    } catch (e) {
      const throttled = e?.name === 'ThrottlingException' || /throttl|too many/i.test(e?.message ?? '');
      if (!throttled || i >= tries) throw e;
      const backoff = 1500 * 2 ** i; // 1.5s, 3s, 6s, 12s, 24s, 48s
      process.stdout.write(`\r  throttled — backing off ${backoff / 1000}s…           `);
      await sleep(backoff);
    }
  }
}

const toVector = (arr) => `[${arr.join(',')}]`;
const DAY = 86_400_000;
const isoDate = (offsetDays) => new Date(Date.now() - offsetDays * DAY).toISOString().slice(0, 10);

const client = createPool();

try {
  await client.query('DELETE FROM sold_comparables');
  console.log(
    `Embedding ${COMPARABLES.length} comparables via ${EMBED_MODEL_ID} (dim ${EMBED_DIM})…`
  );

  let n = 0;
  for (const c of COMPARABLES) {
    const caption = `${c.title}. ${c.brand} ${c.category} ${c.condition}`;
    const vec = toVector(await embed(caption));
    const soldDate = isoDate(c.daysAgo);
    const listedDate = isoDate(c.daysAgo + c.days);

    await client.query(
      `INSERT INTO sold_comparables
         (platform, source, title, brand, category, condition, sold_price, listed_date, sold_date, embedding)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::vector)`,
      [
        c.platform,
        c.source,
        c.title,
        c.brand,
        c.category,
        c.condition,
        c.sold_price,
        listedDate,
        soldDate,
        vec,
      ]
    );
    n++;
    process.stdout.write(`\r  ${n}/${COMPARABLES.length} comparables embedded            `);
    await sleep(400); // pace requests to stay under the on-demand throttle
  }

  console.log(`\n✓ Seeded sold_comparables with ${n} rows`);
  const live = COMPARABLES.filter((c) => c.source === 'ebay_api').length;
  console.log(`  ${live} labeled live (eBay API), ${COMPARABLES.length - live} estimated.`);
} catch (err) {
  console.error('\n✗ Seed failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}

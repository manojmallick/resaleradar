import { NextRequest, NextResponse } from 'next/server';
import { query, toVector } from '@/lib/db';
import { identifyItem } from '@/lib/vision';
import { generateMultimodalEmbedding } from '@/lib/embeddings';
import { getDemoUserId } from '@/lib/context';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { imageBase64, mediaType? }
// photo → Claude vision identify → multimodal (image) embedding → persist item.
export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = (await req.json()) as {
      imageBase64?: string;
      mediaType?: 'image/jpeg' | 'image/png';
    };
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
    }

    // 1. Identify the item from the photo.
    const id = await identifyItem(imageBase64, mediaType ?? 'image/jpeg');

    // 2. Embed the actual photo (sharpened by the caption) — real visual vector.
    const embedding = await generateMultimodalEmbedding({ imageBase64, caption: id.caption });

    // 3. Persist item + its multimodal embedding.
    const userId = await getDemoUserId();
    const dataUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:${mediaType ?? 'image/jpeg'};base64,${imageBase64}`;

    const item = await query<{ id: string }>(
      `INSERT INTO items (user_id, title, brand, category, condition, image_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userId, id.title, id.brand, id.category, id.condition, dataUrl]
    );
    const itemId = item.rows[0].id;

    await query(
      `INSERT INTO item_embeddings (item_id, embedding) VALUES ($1, $2::vector)`,
      [itemId, toVector(embedding)]
    );

    await query(`UPDATE users SET scans_this_month = scans_this_month + 1 WHERE id = $1`, [userId]);

    return NextResponse.json({ itemId, ...id });
  } catch (err) {
    console.error('[identify]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

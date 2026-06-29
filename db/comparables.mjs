// ─────────────────────────────────────────────────────────────
// Reference sold-comparable data the valuation searches against.
//
// HONEST FRAMING (this is the whole point):
//   source: 'ebay_api'  → represents data licensed from eBay's official API.
//   source: 'estimated' → Poshmark/Depop have no open sold-data API, so these
//                         are modeled from comparable eBay sold data. The UI
//                         labels them "estimated" everywhere.
//
// Each row carries listed_date + sold_date so days-to-sell velocity is real.
// Note the deliberate pattern: Poshmark often shows a higher median but a much
// longer time-on-market — so it loses on $/day. That's the insight we surface.
// ─────────────────────────────────────────────────────────────

// helper: build one comp. `days` = listed→sold gap; `daysAgo` = sold date offset.
function comp(platform, source, brand, category, condition, price, days, daysAgo, title) {
  return { platform, source, brand, category, condition, sold_price: price, days, daysAgo, title };
}

export const COMPARABLES = [
  // ── Sneakers: Air Jordan 1 Chicago ──
  comp('ebay', 'ebay_api', 'Nike', 'sneakers', 'like_new', 172, 5, 12, 'Nike Air Jordan 1 Retro High OG Chicago size 10'),
  comp('ebay', 'ebay_api', 'Nike', 'sneakers', 'good', 158, 7, 20, 'Air Jordan 1 High Chicago worn good condition'),
  comp('ebay', 'ebay_api', 'Nike', 'sneakers', 'like_new', 189, 6, 30, 'Jordan 1 Retro High OG Chicago DS'),
  comp('ebay', 'ebay_api', 'Nike', 'sneakers', 'new', 235, 4, 8, 'Air Jordan 1 Chicago brand new in box'),
  comp('poshmark', 'estimated', 'Nike', 'sneakers', 'like_new', 195, 19, 25, 'Jordan 1 Chicago like new'),
  comp('poshmark', 'estimated', 'Nike', 'sneakers', 'good', 180, 22, 33, 'AJ1 Chicago good condition'),
  comp('depop', 'estimated', 'Nike', 'sneakers', 'like_new', 170, 11, 14, 'jordan 1 chicago 🔥 size 10'),
  comp('depop', 'estimated', 'Nike', 'sneakers', 'good', 160, 13, 21, 'aj1 chicago worn'),

  // ── Sneakers: New Balance 990 ──
  comp('ebay', 'ebay_api', 'New Balance', 'sneakers', 'good', 92, 6, 16, 'New Balance 990v5 grey made in USA'),
  comp('ebay', 'ebay_api', 'New Balance', 'sneakers', 'like_new', 118, 5, 9, 'NB 990v5 grey like new size 9.5'),
  comp('poshmark', 'estimated', 'New Balance', 'sneakers', 'good', 105, 17, 28, 'New Balance 990 grey'),
  comp('depop', 'estimated', 'New Balance', 'sneakers', 'good', 98, 10, 12, 'nb 990 dad shoes grey'),

  // ── Handbags: Louis Vuitton Neverfull ──
  comp('ebay', 'ebay_api', 'Louis Vuitton', 'handbags', 'good', 890, 9, 18, 'Louis Vuitton Neverfull MM monogram authentic'),
  comp('ebay', 'ebay_api', 'Louis Vuitton', 'handbags', 'like_new', 1050, 8, 27, 'LV Neverfull MM monogram like new'),
  comp('ebay', 'ebay_api', 'Louis Vuitton', 'handbags', 'fair', 720, 12, 35, 'Louis Vuitton Neverfull worn patina'),
  comp('poshmark', 'estimated', 'Louis Vuitton', 'handbags', 'good', 980, 24, 30, 'LV Neverfull MM authentic monogram'),
  comp('poshmark', 'estimated', 'Louis Vuitton', 'handbags', 'like_new', 1120, 21, 22, 'Louis Vuitton Neverfull MM excellent'),
  comp('depop', 'estimated', 'Louis Vuitton', 'handbags', 'good', 850, 16, 19, 'louis vuitton neverfull mono'),

  // ── Handbags: Coach tote ──
  comp('ebay', 'ebay_api', 'Coach', 'handbags', 'good', 78, 7, 14, 'Coach signature tote brown'),
  comp('ebay', 'ebay_api', 'Coach', 'handbags', 'like_new', 96, 6, 10, 'Coach tote like new leather'),
  comp('poshmark', 'estimated', 'Coach', 'handbags', 'good', 88, 15, 26, 'Coach signature tote'),
  comp('depop', 'estimated', 'Coach', 'handbags', 'good', 72, 12, 17, 'coach tote y2k brown'),

  // ── Apparel: Carhartt Detroit jacket ──
  comp('ebay', 'ebay_api', 'Carhartt', 'apparel', 'good', 82, 6, 13, 'Carhartt Detroit jacket brown duck blanket lined'),
  comp('ebay', 'ebay_api', 'Carhartt', 'apparel', 'fair', 64, 9, 24, 'Carhartt Detroit jacket vintage worn'),
  comp('ebay', 'ebay_api', 'Carhartt', 'apparel', 'like_new', 110, 5, 7, 'Carhartt Detroit jacket like new'),
  comp('poshmark', 'estimated', 'Carhartt', 'apparel', 'good', 95, 20, 29, 'Carhartt Detroit jacket brown'),
  comp('depop', 'estimated', 'Carhartt', 'apparel', 'good', 88, 8, 11, 'carhartt detroit jacket vintage 🤎'),
  comp('depop', 'estimated', 'Carhartt', 'apparel', 'fair', 70, 10, 16, 'carhartt detroit worn in'),

  // ── Apparel: Patagonia fleece ──
  comp('ebay', 'ebay_api', 'Patagonia', 'apparel', 'good', 58, 5, 12, 'Patagonia Synchilla Snap-T fleece pullover'),
  comp('ebay', 'ebay_api', 'Patagonia', 'apparel', 'like_new', 72, 4, 6, 'Patagonia Snap-T fleece like new'),
  comp('poshmark', 'estimated', 'Patagonia', 'apparel', 'good', 65, 16, 23, 'Patagonia Synchilla fleece'),
  comp('depop', 'estimated', 'Patagonia', 'apparel', 'good', 60, 9, 13, 'patagonia snap t fleece vintage'),

  // ── Watches: Seiko 5 ──
  comp('ebay', 'ebay_api', 'Seiko', 'watches', 'good', 118, 8, 15, 'Seiko 5 automatic SNK809 black dial'),
  comp('ebay', 'ebay_api', 'Seiko', 'watches', 'like_new', 142, 6, 9, 'Seiko 5 SNK809 like new'),
  comp('poshmark', 'estimated', 'Seiko', 'watches', 'good', 130, 23, 31, 'Seiko 5 automatic watch'),
  comp('depop', 'estimated', 'Seiko', 'watches', 'good', 122, 14, 18, 'seiko 5 automatic field watch'),

  // ── Electronics: iPad ──
  comp('ebay', 'ebay_api', 'Apple', 'electronics', 'good', 235, 4, 10, 'Apple iPad 9th gen 64GB WiFi space gray'),
  comp('ebay', 'ebay_api', 'Apple', 'electronics', 'like_new', 285, 3, 5, 'iPad 9th gen 64GB like new'),
  comp('poshmark', 'estimated', 'Apple', 'electronics', 'good', 255, 18, 21, 'Apple iPad 9th generation'),
  comp('depop', 'estimated', 'Apple', 'electronics', 'good', 240, 9, 12, 'ipad 9th gen 64gb'),
]

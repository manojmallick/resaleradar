// UI-facing view types. The single source of truth lives in lib/data.ts (which
// the server fetchers in lib/queries.ts also use) so the v0 components and the
// backend can never drift. Re-exported here because the v0 UI imports from
// '@/lib/types'.
export type {
  PlatformValuation,
  ItemSummary,
  ListingView,
  ItemReport,
} from './data'
export type { Valuation } from './valuation'

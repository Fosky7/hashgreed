// src/lib/blockchain/kross/marketplace-db.types.ts
//
// Shared TypeScript model types for the Marketplace core tables (part 1/3).
// The sale-recording API (part 2) and read endpoints (part 3) import these so
// the client and database stay in lockstep. These mirror the SQL migration
// exactly: snake_case column names, integer wavelets as numbers, enums as
// string unions.

export type MarketplaceRole = 'buyer' | 'seller' | 'admin';
export type ListingStatus = 'active' | 'sold' | 'delisted' | 'expired';
export type OrderStatus =
  | 'pending'
  | 'broadcast'
  | 'settled'
  | 'failed'
  | 'cancelled';

/** A wallet that participates in the marketplace (buyer/seller/admin). */
export interface ParticipantRow {
  id: string;
  address: string;
  role: MarketplaceRole;
  is_admin: boolean;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

/** Off-chain projection of an on-chain escrow listing. */
export interface ListingRow {
  id: string;
  asset_id: string;
  seller_address: string;
  price_wavelets: number;
  price_kss: number;
  category: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

/** A buyer's purchase intent / captured sale, with the computed split. */
export interface OrderRow {
  id: string;
  listing_id: string;
  asset_id: string;
  buyer_address: string;
  seller_address: string;
  price_wavelets: number;
  fee_wavelets: number;
  royalty_wavelets: number;
  seller_wavelets: number;
  fee_basis_points: number;
  royalty_basis_points: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

/** Immutable settled-sale ledger entry (append-only). */
export interface TransactionRow {
  id: string;
  order_id: string;
  asset_id: string;
  tx_id: string;
  explorer_url: string | null;
  buyer_address: string;
  seller_address: string;
  creator_address: string | null;
  fee_wallet_address: string | null;
  price_wavelets: number;
  fee_wavelets: number;
  royalty_wavelets: number;
  seller_wavelets: number;
  created_at: string;
}

/** Insert shapes (server-defaulted columns omitted). */
export type ListingInsert = Pick<
  ListingRow,
  'asset_id' | 'seller_address' | 'price_wavelets' | 'price_kss'
> &
  Partial<Pick<ListingRow, 'category' | 'status'>>;

export type OrderInsert = Pick<
  OrderRow,
  | 'listing_id'
  | 'asset_id'
  | 'buyer_address'
  | 'seller_address'
  | 'price_wavelets'
> &
  Partial<
    Pick<
      OrderRow,
      | 'fee_wavelets'
      | 'royalty_wavelets'
      | 'seller_wavelets'
      | 'fee_basis_points'
      | 'royalty_basis_points'
      | 'status'
    >
  >;

export type TransactionInsert = Pick<
  TransactionRow,
  | 'order_id'
  | 'asset_id'
  | 'tx_id'
  | 'buyer_address'
  | 'seller_address'
  | 'price_wavelets'
> &
  Partial<
    Pick<
      TransactionRow,
      | 'explorer_url'
      | 'creator_address'
      | 'fee_wallet_address'
      | 'fee_wavelets'
      | 'royalty_wavelets'
      | 'seller_wavelets'
    >
  >;

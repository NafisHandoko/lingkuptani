export type DemandItem = {
  commodity: string;
  price: number;
  demand: number;
};

export type Demand = DemandItem[];

export type Transaksi = {
  id: number;
  toko_id: string;
  user_id: number;
  demand: Demand;
  verified: boolean;
  created_at: string;
};

// Payload for POST (create) & PATCH (update) store
export type TransaksiInput = {
  demand: Demand;
  verified: boolean;
};

export const EMPTY_DEMAND: Demand = [{ commodity: "Padi", price: 50000, demand: 100 }];

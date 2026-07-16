export type Demand = {
  padi: number;
  jagung: number;
  mangga: number;
};

// Store data shape as returned by GET /api/toko
export type Toko = {
  id: number;
  name: string;
  longitude: string;
  latitude: string;
  demand: Demand;
  price: string;
  contact: string;
  address: string;
  created_at: string;
  user_id: string;
};

// Payload for POST (create) & PATCH (update) store
export type TokoInput = {
  name: string;
  longitude: string;
  latitude: string;
  demand: Demand;
  price: string;
  contact: string;
  address: string;
};

export const EMPTY_DEMAND: Demand = { padi: 0, jagung: 0, mangga: 0 };

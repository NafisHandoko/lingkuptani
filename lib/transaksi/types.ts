export type DemandItem = {
  commodity: string;
  price: number | string;
  demand: number;
};

export type Demand = DemandItem[];

export type TransaksiStatus = "pending" | "accepted" | "rejected";

export type Transaksi = {
  id: number;
  seller: string;    // user UUID (foreign key → users.id)
  buyer: number;     // toko id  (foreign key → toko.id)
  demand: Demand;
  status: TransaksiStatus;
  created_at: string;
};

// Payload for POST (create) new transaction
export type TransaksiInput = {
  buyer: number;    // toko id
  demand: Demand;
};

// Payload for PATCH (update status only)
export type TransaksiStatusUpdate = {
  status: TransaksiStatus;
};

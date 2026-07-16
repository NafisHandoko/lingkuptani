export type Store = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
};

/**
 * Data dummy toko (sekitar Jakarta Pusat / Monas).
 * Ganti dengan data asli dari Supabase saat sudah siap.
 */
export const DUMMY_STORES: Store[] = [
  {
    id: "toko-a",
    name: "Toko Tani Makmur",
    address: "Jl. Medan Merdeka Barat No. 12, Gambir, Jakarta Pusat",
    lat: -6.1745,
    lng: 106.8227,
    category: "Sarana Produksi Pertanian",
  },
  {
    id: "toko-b",
    name: "Toko Benih Sejahtera",
    address: "Jl. M.H. Thamrin No. 5, Menteng, Jakarta Pusat",
    lat: -6.1889,
    lng: 106.8236,
    category: "Benih & Bibit",
  },
  {
    id: "toko-c",
    name: "Toko Pupuk Subur",
    address: "Jl. Kebon Sirih No. 20, Menteng, Jakarta Pusat",
    lat: -6.1836,
    lng: 106.8331,
    category: "Pupuk & Nutrisi",
  },
  {
    id: "toko-d",
    name: "Toko Alat Tani Jaya",
    address: "Jl. Cikini Raya No. 45, Menteng, Jakarta Pusat",
    lat: -6.1932,
    lng: 106.8412,
    category: "Alat Pertanian",
  },
  {
    id: "toko-e",
    name: "Toko Hasil Bumi Berkah",
    address: "Jl. Gunung Sahari No. 78, Sawah Besar, Jakarta Pusat",
    lat: -6.1633,
    lng: 106.8402,
    category: "Hasil Panen",
  },
];

/** Titik tengah peta default (Monas, Jakarta). */
export const DEFAULT_CENTER: [number, number] = [-6.1754, 106.8272];
export const DEFAULT_ZOOM = 14;

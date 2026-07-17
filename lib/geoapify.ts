const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY ?? "";

export const GEOAPIFY_TILE_URL = `https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`;

export const GEOAPIFY_ATTRIBUTION =
  'Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Geoapify</a> | © OpenStreetMap contributors';

export type ReverseGeocodeResult = {
  formatted: string;
  city?: string;
  suburb?: string;
  street?: string;
  postcode?: string;
  lat: number;
  lon: number;
};

// Reverse geocoding: turn coordinates into address
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<ReverseGeocodeResult> {
  const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("lang", "id");
  url.searchParams.set("apiKey", GEOAPIFY_KEY);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Geoapify reverse geocode failed: ${res.status}`);
  }

  const data = await res.json();
  const r = data?.results?.[0];
  if (!r) {
    throw new Error("No address found for these coordinates.");
  }

  return {
    formatted: r.formatted ?? `${lat}, ${lon}`,
    city: r.city,
    suburb: r.suburb,
    street: r.street,
    postcode: r.postcode,
    lat,
    lon,
  };
}

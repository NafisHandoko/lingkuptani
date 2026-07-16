"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Leaflet mengakses `window`, jadi map di-render hanya di client (ssr: false).
// `ssr: false` hanya diperbolehkan di dalam Client Component (Next.js 16).
const StoreMap = dynamic(() => import("@/components/map/store-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-muted">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export default function Home() {
  return <StoreMap />;
}

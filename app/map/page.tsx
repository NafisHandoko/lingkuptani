"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const StoreMap = dynamic(() => import("@/components/map/store-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center" style={{ background: '#EEEEEE' }}>
      <Loader2 className="size-6 animate-spin" style={{ color: '#6FCF97' }} />
    </div>
  ),
});

export default function MapPage() {
  return <StoreMap />;
}

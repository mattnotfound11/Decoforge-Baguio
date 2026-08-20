import { NextResponse } from "next/server";
import { getStockSnapshot } from "@/lib/stock";

// Availability must never be served from a cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const snapshot = await getStockSnapshot();

  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

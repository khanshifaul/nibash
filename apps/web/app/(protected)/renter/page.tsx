"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inquiriesApi, type Inquiry } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RenterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.push("/sign-in"); }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      try { setItems(await inquiriesApi.listForRenter()); }
      catch (e) { setError(e instanceof Error ? e.message : "Failed to load inquiries"); }
    })();
  }, [user]);

  if (loading || !user) return <div className="p-8">Loading...</div>;
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">My inquiries</h1>
      <p className="text-gray-600 mb-6">Track your visit requests and messages.</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {items.length === 0 ? (
        <p className="text-gray-600">No inquiries yet. <Link href="/search" className="underline">Browse properties</Link>.</p>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <div key={q.id} className="border rounded p-4">
              <div className="font-semibold">{q.building.name} — Unit {q.apartment.unitLabel}</div>
              <div className="text-sm text-gray-600">{q.building.areaZone} • Status: {q.status}</div>
              {q.message && <p className="text-sm mt-2">{q.message}</p>}
              <div className="text-xs text-gray-500 mt-1">{new Date(q.createdAt).toLocaleString()}</div>
              <Link href={`/listings/${q.apartment.id}`} className="text-sm underline mt-2 inline-block">View property</Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

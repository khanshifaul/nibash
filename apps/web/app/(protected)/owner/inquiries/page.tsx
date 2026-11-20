"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inquiriesApi, type Inquiry } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function OwnerInquiriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.push("/sign-in"); }, [loading, user, router]);

  async function load() {
    try { setItems(await inquiriesApi.listForOwner()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load inquiries"); }
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function setStatus(id: string, status: string) {
    try { await inquiriesApi.updateStatus(id, { status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Update failed"); }
  }

  if (loading || !user) return <div className="p-8">Loading...</div>;
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Owner inbox (inquiries)</h1>
        <Link href="/owner/dashboard" className="underline text-sm">Dashboard</Link>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {items.length === 0 ? <p className="text-gray-600">No inquiries yet.</p> : (
        <div className="space-y-3">
          {items.map((q) => (
            <div key={q.id} className="border rounded p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <div className="font-semibold">{q.building.name} — Unit {q.apartment.unitLabel}{q.apartment.floor ? ` (Floor ${q.apartment.floor.floorNumber})` : ""}</div>
                  <div className="text-sm text-gray-600">From: {q.renter.name || q.renter.email} • {q.renter.phone || "no phone"} • {q.renter.email}</div>
                  {q.message && <p className="text-sm mt-2">{q.message}</p>}
                  <div className="text-xs text-gray-500 mt-1">{new Date(q.createdAt).toLocaleString()} • Status: {q.status}</div>
                </div>
                <div className="flex gap-2 items-start">
                  {["CONTACTED", "SCHEDULED", "CLOSED", "SPAM"].map((s) => (
                    <button key={s} onClick={() => setStatus(q.id, s)} className="text-xs border rounded px-2 py-1">{s}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

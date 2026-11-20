"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

type Building = {
  id: string; name: string; areaZone: string; slug: string;
  moderationStatus: string; owner: { name: string | null };
  totalFloors: number; createdAt: string;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.push("/sign-in"); }, [loading, user, router]);

  async function load() {
    try {
      const data = await api.get<Building[]>("/buildings");
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load buildings");
    }
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function moderate(id: string, status: string, reason?: string) {
    setSaving(id);
    try {
      await api.patch(`/admin/buildings/${id}/moderation`, { moderationStatus: status, reason });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Moderation failed");
    } finally {
      setSaving(null);
    }
  }

  if (loading || !user) return <div className="p-8">Loading...</div>;
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Moderation queue</h1>
        <Link href="/owner/dashboard" className="underline text-sm">Dashboard</Link>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {items.length === 0 ? (
        <p className="text-gray-600">No buildings to moderate.</p>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="border rounded p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-sm text-gray-600">{b.areaZone} • {b.totalFloors} floors • by {b.owner?.name ?? "—"}</div>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={b.moderationStatus === "APPROVED" ? "default" : b.moderationStatus === "REJECTED" ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {b.moderationStatus}
                  </Badge>
                  {b.moderationStatus === "PENDING_REVIEW" && (
                    <>
                      <button
                        onClick={() => moderate(b.id, "APPROVED")}
                        disabled={saving === b.id}
                        className="text-xs border rounded px-2 py-1 bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => moderate(b.id, "REJECTED", "Needs review")}
                        disabled={saving === b.id}
                        className="text-xs border rounded px-2 py-1 bg-red-50 text-red-800 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

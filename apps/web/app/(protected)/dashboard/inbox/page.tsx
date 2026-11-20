"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inquiriesApi, type Inquiry } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";

const STATUSES = ["CONTACTED", "SCHEDULED", "CLOSED", "SPAM"] as const;

export default function DashboardInboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.push("/sign-in"); }, [loading, user, router]);

  async function load() {
    try { setItems(await inquiriesApi.listForOwner()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load inbox"); }
  }
  useEffect(() => { if (user) load(); }, [user]);

  async function setStatus(id: string, status: string) {
    try { await inquiriesApi.updateStatus(id, { status }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Update failed"); }
  }

  if (loading || !user) return <div className="max-w-6xl mx-auto px-4 py-10">Loading…</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">Owner inbox</h1>
        <p className="text-muted-foreground mt-1">Inquiries from renters interested in your properties.</p>
      </div>

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="font-semibold text-lg">No inquiries yet</h2>
            <p className="text-muted-foreground text-sm mt-1">When renters contact you about your properties, their messages will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold">{q.building.name} — Unit {q.apartment.unitLabel}</h2>
                      {q.apartment.floor && <span className="text-sm text-muted-foreground">Floor {q.apartment.floor.floorNumber}</span>}
                      <Badge variant={q.status === "PENDING" ? "default" : "secondary"}>{q.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">From: {q.renter.name || "Renter"} • {q.renter.email}{q.renter.phone ? ` • ${q.renter.phone}` : ""}</p>
                    {q.message && <p className="text-sm mt-2 whitespace-pre-wrap">{q.message}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{new Date(q.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {STATUSES.map((s) => (
                      <Button key={s} size="sm" variant={q.status === s ? "default" : "outline"} onClick={() => setStatus(q.id, s)} className="text-xs h-8">{s}</Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

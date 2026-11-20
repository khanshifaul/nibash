"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inquiriesApi, type Inquiry } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { FiArrowLeft } from "react-icons/fi";

export default function DashboardInquiriesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setItems(await inquiriesApi.listForRenter());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load inquiries");
      }
    })();
  }, [user]);

  if (loading || !user) return <div className="max-w-4xl mx-auto px-4 py-10">Loading…</div>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          <FiArrowLeft className="inline h-4 w-4" aria-hidden="true" /> Dashboard
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">My inquiries</h1>
        <p className="text-muted-foreground mt-1">
          Track inquiries you’ve sent to property owners as a renter.
        </p>
      </div>

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="font-semibold text-lg">No inquiries yet</h2>
            <p className="text-muted-foreground text-sm mt-1">
              When you contact an owner about a property, your inquiries will appear here.
            </p>
            <Link href="/search" className="inline-block mt-5">
              <Button>Browse properties</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold">
                        {q.building.name} — Unit {q.apartment.unitLabel}
                      </h2>
                      <Badge variant="secondary">{q.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{q.building.areaZone}</p>
                    {q.message && <p className="text-sm mt-2">{q.message}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(q.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/listings/${q.apartment.id}`} className="shrink-0">
                    <Button variant="outline" size="sm">
                      View property
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

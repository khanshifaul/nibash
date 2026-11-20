"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildingsApi, type Building } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Plus } from "lucide-react";

export default function DashboardPropertiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try { setBuildings(await buildingsApi.findMine()); }
      catch (e) { setError(e instanceof Error ? e.message : "Failed to load properties"); }
    })();
  }, [user]);

  if (loading || !user) return <div className="max-w-6xl mx-auto px-4 py-10">Loading…</div>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">My properties</h1>
          <p className="text-muted-foreground mt-1">Manage your buildings and apartments as an owner.</p>
        </div>
        <Link href="/dashboard/properties/new"><Button className="gap-2"><Plus className="h-4 w-4" /> Add property</Button></Link>
      </div>

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {buildings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h2 className="font-semibold text-lg">No properties yet</h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">List your first building to add apartments, publish availability, and receive inquiries from renters.</p>
            <Link href="/dashboard/properties/new" className="inline-block mt-5"><Button>Add your first property</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings.map((b) => {
            const units = b.floors.reduce((s, f) => s + f.apartments.length, 0);
            const available = b.floors.reduce((s, f) => s + f.apartments.filter((a) => a.availabilityStatus === "AVAILABLE").length, 0);
            return (
              <Link key={b.id} href={`/dashboard/properties/${b.id}`} className="block group">
                <Card className="h-full hover:shadow-md hover:border-primary/20 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{b.name}</h2>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{b.areaZone}</span>
                        </div>
                      </div>
                      <Badge variant={b.moderationStatus === "APPROVED" ? "default" : "secondary"} className="shrink-0 text-[10px]">{b.moderationStatus}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm text-muted-foreground">
                      <span>{b.totalFloors} floors</span>
                      <span>{units} units</span>
                      <span className="text-foreground font-medium">{available} available</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

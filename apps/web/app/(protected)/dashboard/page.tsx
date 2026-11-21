"use client";

import { Building2, Inbox, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Building, buildingsApi, type Inquiry, inquiriesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);
  const [ownerInbox, setOwnerInbox] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [b, mine, inbox] = await Promise.all([
          buildingsApi.findMine().catch(() => [] as Building[]),
          inquiriesApi.listForRenter().catch(() => [] as Inquiry[]),
          inquiriesApi.listForOwner().catch(() => [] as Inquiry[]),
        ]);
        setBuildings(b);
        setMyInquiries(mine);
        setOwnerInbox(inbox);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
  }, [user]);

  if (loading || !user) return <div className="max-w-6xl mx-auto px-4 py-10">Loading…</div>;

  const totalUnits = buildings.reduce(
    (sum, b) => sum + b.floors.reduce((s, f) => s + f.apartments.length, 0),
    0,
  );
  const availableUnits = buildings.reduce(
    (sum, b) =>
      sum +
      b.floors.reduce(
        (s, f) => s + f.apartments.filter((a) => a.availabilityStatus === "AVAILABLE").length,
        0,
      ),
    0,
  );
  const pendingInbox = ownerInbox.filter((q) => q.status === "PENDING").length;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{user.name ? `, ${user.name}` : ""}. Manage your properties and track
            inquiries in one place.
          </p>
          {!user.isEmailVerified && (
            <p className="text-amber-700 text-sm mt-2">
              Email not verified — verify to publish properties and view contact details.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/properties/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add property
            </Button>
          </Link>
        </div>
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">My properties</div>
            <div className="text-2xl font-bold mt-1">{buildings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">Available units</div>
            <div className="text-2xl font-bold mt-1">
              {availableUnits}
              <span className="text-sm font-normal text-muted-foreground">/{totalUnits}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">Owner inbox</div>
            <div className="text-2xl font-bold mt-1">
              {ownerInbox.length}
              {pendingInbox > 0 && (
                <Badge variant="secondary" className="ml-2 align-middle">
                  {pendingInbox} new
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-sm text-muted-foreground">My inquiries</div>
            <div className="text-2xl font-bold mt-1">{myInquiries.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" /> My properties
            </CardTitle>
            <Link
              href="/dashboard/properties"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View all <FiArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {buildings.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                <p>You haven’t listed any properties yet.</p>
                <Link
                  href="/dashboard/properties/new"
                  className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                >
                  Add your first property <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {buildings.slice(0, 4).map((b) => (
                  <Link
                    key={b.id}
                    href={`/dashboard/properties/${b.id}`}
                    className="block border rounded-lg p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{b.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {b.areaZone} • {b.totalFloors} floors
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {b.moderationStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Inbox className="h-5 w-5" /> Owner inbox
              </CardTitle>
              <Link
                href="/dashboard/inbox"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View all <FiArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {ownerInbox.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No inquiries received on your properties yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {ownerInbox.slice(0, 3).map((q) => (
                    <div key={q.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">
                          {q.building.name} — Unit {q.apartment.unitLabel}
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {q.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        From {q.renter.name || q.renter.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> My inquiries
              </CardTitle>
              <Link
                href="/dashboard/inquiries"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View all <FiArrowRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {myInquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You haven’t sent any inquiries yet.{" "}
                  <Link href="/search" className="text-primary hover:underline">
                    Browse properties
                  </Link>{" "}
                  to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {myInquiries.slice(0, 3).map((q) => (
                    <Link
                      key={q.id}
                      href={`/listings/${q.apartment.id}`}
                      className="block border rounded-lg p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm truncate">
                          {q.building.name} — Unit {q.apartment.unitLabel}
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {q.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {q.building.areaZone}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

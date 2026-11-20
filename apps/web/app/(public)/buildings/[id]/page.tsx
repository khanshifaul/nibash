"use client";

import { Building2, Home, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import {
  MdBolt,
  MdElevator,
  MdLocalParking,
  MdPhoneInTalk,
  MdRoofing,
  MdSecurity,
  MdVideocam,
  MdWaterDrop,
} from "react-icons/md";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Map from "@/components/ui/map";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { type Building, buildingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function BuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const [building, setBuilding] = useState<Building | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBuilding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await buildingsApi.findPublic(id);
      setBuilding(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load building");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBuilding();
  }, [loadBuilding]);

  const coverImage = building?.images.find((i) => i.isCover) ?? building?.images[0] ?? null;

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 rounded-lg w-1/3" />
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </main>
    );
  }

  if (error || !building) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold">{error || "Building not found"}</h2>
        <p className="text-muted-foreground mt-2">
          <Link href="/search" className="underline">
            Browse properties
          </Link>
        </p>
      </main>
    );
  }

  const allUnits = building.floors.flatMap((f) => f.apartments);
  const availableUnits = allUnits.filter((u) => u.availabilityStatus === "AVAILABLE");

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: cover + details */}
        <section className="lg:col-span-8 space-y-6">
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
            {coverImage ? (
              <img
                src={coverImage.url}
                alt={coverImage.caption ?? "Building cover"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Building2 className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-xs text-white">
              {building.totalFloors} floors
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{building.name}</h1>
              <Badge variant="outline">{building.totalFloors} floors</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" /> {building.areaZone}
              {building.addressLine && (
                <>
                  <span className="mx-1">•</span>
                  {building.addressLine}
                </>
              )}
            </div>
            <p className="text-muted-foreground">
              {building.owner?.name
                ? `Managed by ${building.owner.name}`
                : "Owner contact not public"}
            </p>

            <Separator />

            <h3 className="text-lg font-semibold mb-2">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {building.hasElevator && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdElevator className="h-3.5 w-3.5" /> Lift ({building.elevatorCount ?? 1})
                </Badge>
              )}
              {building.hasParking && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdLocalParking className="h-3.5 w-3.5" /> Parking ({building.parkingType})
                </Badge>
              )}
              {building.hasGenerator && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdBolt className="h-3.5 w-3.5" /> Generator
                </Badge>
              )}
              {building.hasSecurityGuard && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdSecurity className="h-3.5 w-3.5" /> Security guard
                </Badge>
              )}
              {building.hasCctv && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdVideocam className="h-3.5 w-3.5" /> CCTV
                </Badge>
              )}
              {building.hasIntercom && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdPhoneInTalk className="h-3.5 w-3.5" /> Intercom
                </Badge>
              )}
              {building.hasRooftop && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdRoofing className="h-3.5 w-3.5" /> Rooftop access
                </Badge>
              )}
              {building.hasSubmersiblePump && (
                <Badge variant="secondary" className="gap-1.5">
                  <MdWaterDrop className="h-3.5 w-3.5" /> Submersible pump
                </Badge>
              )}
              {!building.hasElevator &&
                !building.hasParking &&
                !building.hasGenerator &&
                !building.hasSecurityGuard &&
                !building.hasCctv &&
                !building.hasIntercom &&
                !building.hasRooftop &&
                !building.hasSubmersiblePump && (
                  <span className="text-xs text-muted-foreground">No amenities listed</span>
                )}
            </div>

            <Separator />

            <h3 className="text-lg font-semibold mb-2">
              Units ({availableUnits.length} available)
            </h3>
            {availableUnits.length === 0 ? (
              <p className="text-muted-foreground">No available units right now.</p>
            ) : (
              <div className="space-y-3">
                {availableUnits.map((u) => (
                  <Card key={u.id} className="border-b-0">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{u.unitLabel}</div>
                          <div className="text-xs text-muted-foreground">
                            {u.bedrooms} bed • {u.bathrooms} bath
                          </div>
                        </div>
                        <div className="text-sm font-bold">
                          {u.listingType === "SALE"
                            ? `৳${((u.salePrice ?? 0) / 100).toLocaleString()}`
                            : `৳${(u.rentAmount / 100).toLocaleString()}/mo`}{" "}
                          ({u.listingType === "SALE" ? "sale" : "rent"})
                        </div>
                      </div>
                      <Link
                        href={`/listings/${u.id}`}
                        className="text-xs text-primary underline underline-offset-4 hover:underline"
                      >
                        View details <FiArrowRight className="inline h-4 w-4" aria-hidden="true" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {building.images.length > 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Building photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {building.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.caption ?? "Building"}
                    className="rounded overflow-hidden w-full h-24 object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right: contact + map */}
        <section className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user ? (
                building.contactPhone ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Home className="h-5 w-5 text-muted-foreground" />
                      <div className="text-sm">{building.contactPhone}</div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Owner: {building.owner?.name ?? "—"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No contact phone listed.</p>
                )
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Sign in to view the owner's contact details.
                  </p>
                  <Link href="/sign-in" className="text-sm font-medium underline block mt-2">
                    Sign in
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border relative">
                <Map lat={building.lat} lng={building.lng} className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <MapPin className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {building.addressLine ?? building.areaZone}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

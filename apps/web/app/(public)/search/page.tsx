"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Grid3X3, List, MapPin, Bed, Bath, Maximize, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { searchApi, type ListingCard } from "@/lib/api";

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOM_OPTIONS = [1, 2, 3, 4];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "rent_asc", label: "Rent: low to high" },
  { value: "rent_desc", label: "Rent: high to low" },
] as const;

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<ListingCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const initial = useRef(true);

  const get = (key: string) => searchParams.get(key) ?? "";

  const filters = {
    q: get("q"),
    area: get("area"),
    minRent: Number(get("minRent")) || undefined,
    maxRent: Number(get("maxRent")) || undefined,
    bedrooms: Number(get("bedrooms")) || undefined,
    bathrooms: Number(get("bathrooms")) || undefined,
    verandas: Number(get("verandas")) || undefined,
    minSqft: Number(get("minSqft")) || undefined,
    floorNumber: Number(get("floorNumber")) || undefined,
    excludeGround: get("excludeGround") === "true",
    hasElevator: get("hasElevator") === "true",
    hasParking: get("hasParking") === "true",
    hasGenerator: get("hasGenerator") === "true",
    page: Number(get("page")) || 1,
    limit: 12,
    sort: (get("sort") as "newest" | "rent_asc" | "rent_desc") || "newest",
  };

  const runSearch = useCallback(async () => {
    if (initial.current) {
      initial.current = false;
      if (!mounted) return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchApi.search(filters);
      setResult(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResult([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mounted,
    filters.q, filters.area, filters.minRent, filters.maxRent, filters.bedrooms,
    filters.bathrooms, filters.verandas, filters.minSqft, filters.floorNumber,
    filters.excludeGround, filters.hasElevator, filters.hasParking, filters.hasGenerator,
    filters.sort, filters.page,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(runSearch, 150);
    return () => clearTimeout(t);
  }, [mounted, runSearch]);

  const setParam = (key: string, value: string | boolean | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    const v = String(value ?? "");
    if (v === "" || v === "false" || v === "undefined") params.delete(key);
    else params.set(key, v);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => router.push(pathname);

  const hasActiveFilters = Boolean(
    filters.q || filters.minRent || filters.maxRent || filters.bedrooms || filters.bathrooms ||
    filters.verandas || filters.minSqft || filters.floorNumber || filters.excludeGround ||
    filters.hasElevator || filters.hasParking || filters.hasGenerator
  );

  const formatRent = (n: number | null) =>
    n == null ? "—" : `৳${(n / 100).toLocaleString()}`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find your property</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Searching properties..." : (
              <>
                <span className="font-medium text-foreground">{total}</span> {total === 1 ? "property" : "properties"}
                {hasActiveFilters ? " match your filters" : " available"}
              </>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm mb-5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Filters */}
        <aside className="lg:col-span-3">
          <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-5 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h2>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline font-medium">
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Keyword / area</label>
                <Input
                  value={filters.q}
                  onChange={(e) => setParam("q", e.target.value)}
                  placeholder="e.g. Dhanmondi, Gulshan"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Monthly rent (৳)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={filters.minRent ?? ""}
                    onChange={(e) => setParam("minRent", e.target.value)}
                    placeholder="Min"
                    className="h-9"
                  />
                  <Input
                    type="number"
                    value={filters.maxRent ?? ""}
                    onChange={(e) => setParam("maxRent", e.target.value)}
                    placeholder="Max"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Bedrooms</label>
                  <Select value={filters.bedrooms ? String(filters.bedrooms) : "any"} onValueChange={(v) => setParam("bedrooms", v === "any" ? "" : v)}>
                    <SelectTrigger className="h-9" aria-label="Minimum bedrooms"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {BEDROOM_OPTIONS.map((b) => <SelectItem key={b} value={String(b)}>{b}+</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Bathrooms</label>
                  <Select value={filters.bathrooms ? String(filters.bathrooms) : "any"} onValueChange={(v) => setParam("bathrooms", v === "any" ? "" : v)}>
                    <SelectTrigger className="h-9" aria-label="Minimum bathrooms"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {BATHROOM_OPTIONS.map((b) => <SelectItem key={b} value={String(b)}>{b}+</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amenities</label>
                <div className="flex flex-col gap-2.5 pt-1">
                  {[
                    { key: "hasElevator", label: "Lift / Elevator", checked: filters.hasElevator },
                    { key: "hasParking", label: "Parking", checked: filters.hasParking },
                    { key: "hasGenerator", label: "Generator backup", checked: filters.hasGenerator },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                      <Checkbox checked={opt.checked} onCheckedChange={(v) => setParam(opt.key, Boolean(v))} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Results */}
        <section className="lg:col-span-9 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              {!hasActiveFilters ? "Showing all available properties" : "Filtered results"}
            </p>
            <div className="flex items-center gap-2">
              <Select value={filters.sort} onValueChange={(v) => setParam("sort", v)}>
                <SelectTrigger className="h-9 w-[170px]" aria-label="Sort properties"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 rounded-md transition-colors ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2 rounded-md transition-colors ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {loading && !result ? (
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-4"}>
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className={view === "grid" ? "h-72 rounded-xl" : "h-40 rounded-xl"} />)}
            </div>
          ) : result && result.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-12 text-center">
              <div className="max-w-sm mx-auto">
                <h3 className="font-semibold text-lg">No properties found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {hasActiveFilters
                    ? "Try adjusting or clearing your filters to see more results."
                    : "There are no published properties right now. Check back soon."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear filters</Button>
                )}
              </div>
            </div>
          ) : result ? (
            view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {result.map((item) => (
                  <Link key={item.id} href={`/listings/${item.id}`} className="block group">
                    <Card className="overflow-hidden h-full rounded-xl border-border/70 hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer">
                      <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                        {item.images?.[0]?.url || item.building.coverImage?.url ? (
                          <img
                            src={item.images?.[0]?.url || item.building.coverImage?.url}
                            alt={`${item.building.name} ${item.unitLabel}`}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                            <span className="text-4xl font-bold text-muted-foreground/30">{item.unitLabel}</span>
                          </div>
                        )}
                        <Badge className="absolute top-3 left-3 shadow-sm" variant={item.availabilityStatus === "AVAILABLE" ? "default" : "secondary"}>
                          {item.availabilityStatus === "AVAILABLE" ? "Available" : item.availabilityStatus.replace("_", " ")}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                          {item.building.name} · {item.unitLabel}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.building.areaZone}{item.floorNumber != null ? ` · Floor ${item.floorNumber}` : ""}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3 pt-0">
                        <div className="text-lg font-bold tracking-tight">
                          {formatRent(item.rentAmount)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {item.bedrooms}</span>
                          <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {item.bathrooms}</span>
                          {item.sizeSqft ? <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {item.sizeSqft} sqft</span> : null}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex items-end justify-between gap-2">
                        <div className="flex gap-1 flex-wrap">
                          {item.building.hasElevator && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Lift</span>}
                          {item.building.hasParking && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Parking</span>}
                          {item.building.hasGenerator && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Generator</span>}
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md shrink-0">
                          View details <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {result.map((item) => (
                  <Link key={item.id} href={`/listings/${item.id}`} className="block group">
                    <Card className="overflow-hidden rounded-xl border-border/70 hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative sm:w-64 md:w-72 aspect-[16/10] sm:aspect-auto bg-muted shrink-0 overflow-hidden">
                          {item.images?.[0]?.url || item.building.coverImage?.url ? (
                            <img
                              src={item.images?.[0]?.url || item.building.coverImage?.url}
                              alt={`${item.building.name} ${item.unitLabel}`}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[160px] flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                              <span className="text-4xl font-bold text-muted-foreground/30">{item.unitLabel}</span>
                            </div>
                          )}
                          <Badge className="absolute top-3 left-3 shadow-sm" variant={item.availabilityStatus === "AVAILABLE" ? "default" : "secondary"}>
                            {item.availabilityStatus === "AVAILABLE" ? "Available" : item.availabilityStatus.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors truncate">
                                  {item.building.name} · {item.unitLabel}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{item.building.areaZone}{item.floorNumber != null ? ` · Floor ${item.floorNumber}` : ""}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xl font-bold tracking-tight">{formatRent(item.rentAmount)}</div>
                                <div className="text-xs text-muted-foreground">per month</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5"><Bed className="h-4 w-4" /> {item.bedrooms} bed</span>
                              <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" /> {item.bathrooms} bath</span>
                              {item.sizeSqft ? <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" /> {item.sizeSqft} sqft</span> : null}
                              {item.verandas ? <span>{item.verandas} veranda</span> : null}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 gap-3">
                            <div className="flex gap-1.5 flex-wrap">
                              {item.building.hasElevator && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Lift</span>}
                              {item.building.hasParking && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Parking</span>}
                              {item.building.hasGenerator && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">Generator</span>}
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md shrink-0">
                              View details <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )
          ) : null}
        </section>
      </div>
    </main>
  );
}

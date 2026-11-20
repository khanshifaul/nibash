"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { searchApi, type ListingCard } from "@/lib/api";

type SearchFilters = {
  q: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasElevator: boolean;
  hasParking: boolean;
  hasGenerator: boolean;
  sort: "newest" | "rent_asc" | "rent_desc";
};

const defaultFilters: SearchFilters = {
  q: "",
  hasElevator: false,
  hasParking: false,
  hasGenerator: false,
  sort: "newest",
};

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<ListingCard[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (f: SearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchApi.search({
        q: f.q || undefined,
        minRent: f.minRent,
        maxRent: f.maxRent,
        bedrooms: f.bedrooms,
        bathrooms: f.bathrooms,
        hasElevator: f.hasElevator || undefined,
        hasParking: f.hasParking || undefined,
        hasGenerator: f.hasGenerator || undefined,
        sort: f.sort,
        page: 1,
        limit: 12,
      });
      setResults(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(filters), 250);
    return () => clearTimeout(t);
  }, [open, filters, runSearch]);

  const formatRent = (n: number | null) =>
    n == null ? "—" : `৳${(n / 100).toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle className="text-lg">Search apartments</DialogTitle>
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                placeholder="Search by area, keyword..."
                className="pl-9"
                autoFocus
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters((s) => !s)}
              className="shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 border rounded-lg bg-muted/30">
              <div>
                <label className="text-xs font-medium mb-1 block">Min rent</label>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minRent ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, minRent: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Max rent</label>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxRent ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, maxRent: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Bedrooms</label>
                <Select
                  value={String(filters.bedrooms ?? "")}
                  onValueChange={(v) => setFilters((f) => ({ ...f, bedrooms: v ? Number(v) : undefined }))}
                >
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}+</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Sort</label>
                <Select
                  value={filters.sort}
                  onValueChange={(v) => setFilters((f) => ({ ...f, sort: v as SearchFilters["sort"] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="rent_asc">Price: low to high</SelectItem>
                    <SelectItem value="rent_desc">Price: high to low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm col-span-2 sm:col-span-1">
                <Checkbox checked={filters.hasElevator} onCheckedChange={(v) => setFilters((f) => ({ ...f, hasElevator: Boolean(v) }))} />
                Lift
              </label>
              <label className="flex items-center gap-2 text-sm col-span-2 sm:col-span-1">
                <Checkbox checked={filters.hasParking} onCheckedChange={(v) => setFilters((f) => ({ ...f, hasParking: Boolean(v) }))} />
                Parking
              </label>
              <label className="flex items-center gap-2 text-sm col-span-2 sm:col-span-1">
                <Checkbox checked={filters.hasGenerator} onCheckedChange={(v) => setFilters((f) => ({ ...f, hasGenerator: Boolean(v) }))} />
                Generator
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters(defaultFilters)}
                className="col-span-2 sm:col-span-1"
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm mb-4">{error}</div>
          )}

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              {loading ? "Searching..." : `${total} ${total === 1 ? "property" : "properties"} found`}
            </p>
          </div>

          {loading && !results ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : !results || results.length === 0 ? (
            <div className="rounded-lg border bg-muted/30 p-10 text-center text-muted-foreground">
              {loading ? "Searching..." : "No properties match your search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => (
                <Link key={item.id} href={`/listings/${item.id}`} onClick={() => onOpenChange(false)} className="block">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow h-full cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm line-clamp-1">{item.unitLabel}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">{item.availabilityStatus}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.floorNumber != null && `Floor ${item.floorNumber} • `}{item.building.areaZone}
                      </div>
                      <div className="font-bold">{formatRent(item.rentAmount)}/mo</div>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-muted-foreground">
                      {item.bedrooms} bed • {item.bathrooms} bath • {item.verandas} veranda
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between items-center">
                      <div className="flex gap-1 text-[10px]">
                        {item.building.hasElevator && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Lift</span>}
                        {item.building.hasParking && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Parking</span>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md">View details <ChevronRight className="h-3.5 w-3.5" /></span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

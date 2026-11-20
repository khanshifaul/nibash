"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { type Building, buildingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function EditBuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const [building, setBuilding] = useState<Building | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    areaZone: "",
    roadBlock: "",
    addressLine: "",
    lat: "",
    lng: "",
    totalFloors: "",
    hasElevator: false,
    hasParking: false,
    hasGenerator: false,
    hasSecurityGuard: false,
    hasCctv: false,
    hasRooftop: false,
  });

  const load = useCallback(async () => {
    try {
      const data = await buildingsApi.findOne(id);
      setBuilding(data);
      setForm({
        name: data.name,
        areaZone: data.areaZone,
        roadBlock: data.roadBlock ?? "",
        addressLine: data.addressLine ?? "",
        lat: String(data.lat),
        lng: String(data.lng),
        totalFloors: String(data.totalFloors),
        hasElevator: data.hasElevator,
        hasParking: data.hasParking,
        hasGenerator: data.hasGenerator,
        hasSecurityGuard: data.hasSecurityGuard,
        hasCctv: data.hasCctv,
        hasRooftop: data.hasRooftop,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load building");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && id) load();
  }, [user, id, load]);

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await buildingsApi.update(id, {
        name: form.name,
        areaZone: form.areaZone,
        roadBlock: form.roadBlock || undefined,
        addressLine: form.addressLine || undefined,
        lat: Number(form.lat),
        lng: Number(form.lng),
        totalFloors: Number(form.totalFloors),
        hasElevator: form.hasElevator,
        hasParking: form.hasParking,
        hasGenerator: form.hasGenerator,
        hasSecurityGuard: form.hasSecurityGuard,
        hasCctv: form.hasCctv,
        hasRooftop: form.hasRooftop,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || !building) return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/dashboard/properties/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          <FiArrowLeft className="inline h-4 w-4" aria-hidden="true" /> Back to property
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit property</h1>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={update} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identity & location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Building name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Total floors</label>
                <Input
                  type="number"
                  min={1}
                  value={form.totalFloors}
                  onChange={(e) => setForm((f) => ({ ...f, totalFloors: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Area / neighborhood</label>
                <Input
                  value={form.areaZone}
                  onChange={(e) => setForm((f) => ({ ...f, areaZone: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Road / block</label>
                <Input
                  value={form.roadBlock}
                  onChange={(e) => setForm((f) => ({ ...f, roadBlock: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium block">Full address</label>
              <Input
                value={form.addressLine}
                onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium block">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasElevator}
                  onChange={(e) => setForm((f) => ({ ...f, hasElevator: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Lift / Elevator
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasParking}
                  onChange={(e) => setForm((f) => ({ ...f, hasParking: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Parking
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasGenerator}
                  onChange={(e) => setForm((f) => ({ ...f, hasGenerator: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Generator
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasSecurityGuard}
                  onChange={(e) => setForm((f) => ({ ...f, hasSecurityGuard: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Security guard
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasCctv}
                  onChange={(e) => setForm((f) => ({ ...f, hasCctv: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                CCTV
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasRooftop}
                  onChange={(e) => setForm((f) => ({ ...f, hasRooftop: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Rooftop access
              </label>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            onClick={() => router.push(`/dashboard/properties/${id}`)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground mt-4">
        Building status: <Badge variant="outline">{building.moderationStatus}</Badge>
      </p>
    </main>
  );
}

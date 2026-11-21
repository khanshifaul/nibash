"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { type Building, buildingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const LocationPicker = dynamic(() => import("@/components/ui/location-picker"), { ssr: false });

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
    contactPhone: "",
    lat: "23.8103",
    lng: "90.4125",
    totalFloors: "1",
    hasElevator: false,
    elevatorCount: "1",
    hasParking: false,
    parkingType: "NONE" as "NONE" | "BIKE" | "CAR" | "CAR_AND_BIKE" | "PAID",
    hasGenerator: false,
    generatorScope: "",
    hasSecurityGuard: false,
    hasCctv: false,
    hasIntercom: false,
    hasRooftop: false,
    hasSubmersiblePump: false,
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
        contactPhone: data.contactPhone ?? "",
        lat: String(data.lat),
        lng: String(data.lng),
        totalFloors: String(data.totalFloors),
        hasElevator: data.hasElevator,
        elevatorCount: String(data.elevatorCount ?? 1),
        hasParking: data.hasParking,
        parkingType: (data.parkingType as typeof form.parkingType) ?? "NONE",
        hasGenerator: data.hasGenerator,
        generatorScope: data.generatorScope ?? "",
        hasSecurityGuard: data.hasSecurityGuard,
        hasCctv: data.hasCctv,
        hasIntercom: data.hasIntercom,
        hasRooftop: data.hasRooftop,
        hasSubmersiblePump: data.hasSubmersiblePump,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load building");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && id) void load();
  }, [user, id, load]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await buildingsApi.update(id, {
        name: form.name,
        areaZone: form.areaZone,
        roadBlock: form.roadBlock || undefined,
        addressLine: form.addressLine || undefined,
        contactPhone: form.contactPhone || undefined,
        lat: Number(form.lat),
        lng: Number(form.lng),
        totalFloors: Number(form.totalFloors),
        hasElevator: form.hasElevator,
        elevatorCount: form.hasElevator ? Number(form.elevatorCount) || 1 : undefined,
        hasParking: form.hasParking,
        parkingType: form.parkingType,
        hasGenerator: form.hasGenerator,
        generatorScope: form.generatorScope || undefined,
        hasSecurityGuard: form.hasSecurityGuard,
        hasCctv: form.hasCctv,
        hasIntercom: form.hasIntercom,
        hasRooftop: form.hasRooftop,
        hasSubmersiblePump: form.hasSubmersiblePump,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

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
                <Label htmlFor="name">Building name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFloors">Total floors</Label>
                <Input
                  id="totalFloors"
                  type="text"
                  inputMode="numeric"
                  value={form.totalFloors}
                  onChange={(e) => set("totalFloors", e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="areaZone">Area / neighborhood</Label>
                <Input
                  id="areaZone"
                  value={form.areaZone}
                  onChange={(e) => set("areaZone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roadBlock">Road / block</Label>
                <Input
                  id="roadBlock"
                  value={form.roadBlock}
                  onChange={(e) => set("roadBlock", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine">Full address</Label>
              <Input
                id="addressLine"
                value={form.addressLine}
                onChange={(e) => set("addressLine", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input
                id="contactPhone"
                type="text"
                inputMode="tel"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="e.g. +8801XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Map location</Label>
              <LocationPicker
                lat={Number(form.lat)}
                lng={Number(form.lng)}
                onChange={(lat, lng) => {
                  set("lat", String(lat));
                  set("lng", String(lng));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Selected: {Number(form.lat).toFixed(6)}, {Number(form.lng).toFixed(6)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.hasElevator}
                onCheckedChange={(v) => set("hasElevator", !!v)}
              />
              <MdElevator className="h-4 w-4 text-muted-foreground" /> <span>Lift/Elevator</span>
            </label>
            {form.hasElevator && (
              <div className="ml-6 space-y-1.5 max-w-xs">
                <Label htmlFor="elevatorCount">Number of elevators</Label>
                <Input
                  id="elevatorCount"
                  type="text"
                  inputMode="numeric"
                  value={form.elevatorCount}
                  onChange={(e) => set("elevatorCount", e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.hasParking} onCheckedChange={(v) => set("hasParking", !!v)} />
              <MdLocalParking className="h-4 w-4 text-muted-foreground" /> <span>Parking</span>
            </label>
            {form.hasParking && (
              <NativeSelect
                className="w-auto"
                value={form.parkingType}
                onChange={(e) => set("parkingType", e.target.value as typeof form.parkingType)}
              >
                <option value="CAR">Car</option>
                <option value="BIKE">Bike</option>
                <option value="CAR_AND_BIKE">Car + Bike</option>
                <option value="PAID">Paid</option>
              </NativeSelect>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.hasGenerator}
                onCheckedChange={(v) => set("hasGenerator", !!v)}
              />
              <MdBolt className="h-4 w-4 text-muted-foreground" /> <span>Generator</span>
            </label>
            {form.hasGenerator && (
              <Input
                placeholder="Scope (full/common)"
                value={form.generatorScope}
                onChange={(e) => set("generatorScope", e.target.value)}
              />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.hasSecurityGuard}
                onCheckedChange={(v) => set("hasSecurityGuard", !!v)}
              />
              <MdSecurity className="h-4 w-4 text-muted-foreground" /> <span>Security guard</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.hasCctv} onCheckedChange={(v) => set("hasCctv", !!v)} />
              <MdVideocam className="h-4 w-4 text-muted-foreground" /> <span>CCTV</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.hasIntercom}
                onCheckedChange={(v) => set("hasIntercom", !!v)}
              />
              <MdPhoneInTalk className="h-4 w-4 text-muted-foreground" /> <span>Intercom</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.hasRooftop} onCheckedChange={(v) => set("hasRooftop", !!v)} />
              <MdRoofing className="h-4 w-4 text-muted-foreground" /> <span>Rooftop access</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={form.hasSubmersiblePump}
                onCheckedChange={(v) => set("hasSubmersiblePump", !!v)}
              />
              <MdWaterDrop className="h-4 w-4 text-muted-foreground" />{" "}
              <span>Submersible pump</span>
            </label>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={saving}>
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

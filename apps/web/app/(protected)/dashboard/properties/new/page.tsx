"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MdElevator, MdLocalParking, MdBolt, MdSecurity, MdVideocam, MdPhoneInTalk, MdRoofing, MdWaterDrop } from "react-icons/md";
import { FiArrowLeft } from "react-icons/fi";

export default function NewBuildingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", areaZone: "", roadBlock: "", addressLine: "", contactPhone: user?.phone ?? "",
    lat: "23.8103", lng: "90.4125", totalFloors: "1",
    hasElevator: false, elevatorCount: "1", hasParking: false, parkingType: "NONE",
    hasGenerator: false, generatorScope: "", hasSecurityGuard: false, hasCctv: false,
    hasIntercom: false, hasRooftop: false, hasSubmersiblePump: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const building = await api.post<{ id: string }>("/buildings", {
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
      router.push(`/dashboard/properties/${building.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create building");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 sm:py-10">
      <Link href="/dashboard/properties" className="text-sm text-muted-foreground hover:text-foreground"><FiArrowLeft className="inline h-4 w-4" aria-hidden="true" /> My properties</Link>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Add property</h1>
      <p className="text-muted-foreground mb-6">Add a building with its location and amenities. You can add apartments/units after saving.</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-4">
          <h2 className="font-semibold">Identity & location</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Building name</Label>
            <Input id="name" placeholder="e.g. Rose Garden Heights" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="areaZone">Area / Neighborhood</Label>
              <Input id="areaZone" placeholder="e.g. Dhanmondi" value={form.areaZone} onChange={(e) => set("areaZone", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalFloors">Total floors</Label>
              <Input id="totalFloors" type="text" inputMode="numeric" placeholder="e.g. 10" value={form.totalFloors} onChange={(e) => set("totalFloors", e.target.value.replace(/[^0-9]/g, ""))} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roadBlock">Road / Block</Label>
            <Input id="roadBlock" placeholder="e.g. Road 27, Block A" value={form.roadBlock} onChange={(e) => set("roadBlock", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addressLine">Full address</Label>
            <Input id="addressLine" placeholder="Street address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" type="text" inputMode="tel" placeholder="e.g. +8801XXXXXXXXX" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="text" inputMode="decimal" placeholder="e.g. 23.8103" value={form.lat} onChange={(e) => set("lat", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" type="text" inputMode="decimal" placeholder="e.g. 90.4125" value={form.lng} onChange={(e) => set("lng", e.target.value)} required />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Coordinates are required. You can copy them from Google Maps.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Amenities</h2>
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasElevator} onCheckedChange={(v) => set("hasElevator", !!v)} /> <MdElevator className="h-4 w-4 text-muted-foreground" /> <span>Lift/Elevator</span></label>
          {form.hasElevator && <div className="ml-6 space-y-1.5 max-w-xs"><Label htmlFor="elevatorCount">Number of elevators</Label><Input id="elevatorCount" type="text" inputMode="numeric" placeholder="e.g. 1" value={form.elevatorCount} onChange={(e) => set("elevatorCount", e.target.value.replace(/[^0-9]/g, ""))} /></div>}
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasParking} onCheckedChange={(v) => set("hasParking", !!v)} /> <MdLocalParking className="h-4 w-4 text-muted-foreground" /> <span>Parking</span></label>
          {form.hasParking && (
            <NativeSelect className="w-auto" value={form.parkingType} onChange={(e) => set("parkingType", e.target.value)}>
              <option value="CAR">Car</option><option value="BIKE">Bike</option><option value="CAR_AND_BIKE">Car + Bike</option><option value="PAID">Paid</option>
            </NativeSelect>
          )}
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasGenerator} onCheckedChange={(v) => set("hasGenerator", !!v)} /> <MdBolt className="h-4 w-4 text-muted-foreground" /> <span>Generator</span></label>
          {form.hasGenerator && <Input placeholder="Scope (full/common)" value={form.generatorScope} onChange={(e) => set("generatorScope", e.target.value)} />}
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasSecurityGuard} onCheckedChange={(v) => set("hasSecurityGuard", !!v)} /> <MdSecurity className="h-4 w-4 text-muted-foreground" /> <span>Security guard</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasCctv} onCheckedChange={(v) => set("hasCctv", !!v)} /> <MdVideocam className="h-4 w-4 text-muted-foreground" /> <span>CCTV</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasIntercom} onCheckedChange={(v) => set("hasIntercom", !!v)} /> <MdPhoneInTalk className="h-4 w-4 text-muted-foreground" /> <span>Intercom</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasRooftop} onCheckedChange={(v) => set("hasRooftop", !!v)} /> <MdRoofing className="h-4 w-4 text-muted-foreground" /> <span>Rooftop access</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasSubmersiblePump} onCheckedChange={(v) => set("hasSubmersiblePump", !!v)} /> <MdWaterDrop className="h-4 w-4 text-muted-foreground" /> <span>Submersible pump</span></label>
        </section>

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save property"}
        </Button>
      </form>
    </main>
  );
}

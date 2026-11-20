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
import { MdElevator, MdLocalParking, MdBolt, MdSecurity, MdVideocam, MdPhoneInTalk, MdRoofing, MdWaterDrop } from "react-icons/md";

export default function NewBuildingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", areaZone: "", roadBlock: "", addressLine: "", contactPhone: user?.phone ?? "",
    lat: 23.8103, lng: 90.4125, totalFloors: 1,
    hasElevator: false, elevatorCount: 0, hasParking: false, parkingType: "NONE",
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
        ...form,
        elevatorCount: form.hasElevator ? Number(form.elevatorCount) || 1 : undefined,
        contactPhone: form.contactPhone || undefined,
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
      <Link href="/dashboard/properties" className="text-sm text-muted-foreground hover:text-foreground">← My properties</Link>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Add property</h1>
      <p className="text-muted-foreground mb-6">Add a building with its location and amenities. You can add apartments/units after saving.</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-3">
          <h2 className="font-semibold">Identity & location</h2>
          <Input placeholder="Building name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Area/Neighborhood" value={form.areaZone} onChange={(e) => set("areaZone", e.target.value)} required />
            <Input type="number" min={1} placeholder="Total floors" value={form.totalFloors} onChange={(e) => set("totalFloors", Number(e.target.value))} required />
          </div>
          <Input placeholder="Road/Block" value={form.roadBlock} onChange={(e) => set("roadBlock", e.target.value)} />
          <Input placeholder="Full address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
          <Input placeholder="Contact phone (required for property contact)" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" step="any" placeholder="Latitude" value={form.lat} onChange={(e) => set("lat", Number(e.target.value))} required />
            <Input type="number" step="any" placeholder="Longitude" value={form.lng} onChange={(e) => set("lng", Number(e.target.value))} required />
          </div>
          <p className="text-xs text-gray-500">Google Maps pin picker can be added with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; coordinates required for now.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Amenities</h2>
          <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasElevator} onCheckedChange={(v) => set("hasElevator", !!v)} /> <MdElevator className="h-4 w-4 text-muted-foreground" /> <span>Lift/Elevator</span></label>
          {form.hasElevator && <Input className="w-40" type="number" min={1} placeholder="Elevator count" value={form.elevatorCount} onChange={(e) => set("elevatorCount", Number(e.target.value))} />}
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

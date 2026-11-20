"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
      router.push(`/owner/buildings/${building.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create building");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Add building (Stage A)</h1>
      <p className="text-gray-600 mb-6">Enter building details once. Flats added later inherit these amenities.</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="space-y-3">
          <h2 className="font-semibold">Identity & location</h2>
          <input className="w-full border rounded px-3 py-2" placeholder="Building name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Area/Neighborhood" value={form.areaZone} onChange={(e) => set("areaZone", e.target.value)} required />
            <input className="border rounded px-3 py-2" type="number" min={1} placeholder="Total floors" value={form.totalFloors} onChange={(e) => set("totalFloors", Number(e.target.value))} required />
          </div>
          <input className="w-full border rounded px-3 py-2" placeholder="Road/Block" value={form.roadBlock} onChange={(e) => set("roadBlock", e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Full address" value={form.addressLine} onChange={(e) => set("addressLine", e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Contact phone (required for property contact)" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" type="number" step="any" placeholder="Latitude" value={form.lat} onChange={(e) => set("lat", Number(e.target.value))} required />
            <input className="border rounded px-3 py-2" type="number" step="any" placeholder="Longitude" value={form.lng} onChange={(e) => set("lng", Number(e.target.value))} required />
          </div>
          <p className="text-xs text-gray-500">Google Maps pin picker can be added with NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; coordinates required for now.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold">Amenities</h2>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasElevator} onChange={(e) => set("hasElevator", e.target.checked)} /> Lift/Elevator</label>
          {form.hasElevator && <input className="border rounded px-3 py-2 w-40" type="number" min={1} placeholder="Elevator count" value={form.elevatorCount} onChange={(e) => set("elevatorCount", Number(e.target.value))} />}
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasParking} onChange={(e) => set("hasParking", e.target.checked)} /> Parking</label>
          {form.hasParking && (
            <select className="border rounded px-3 py-2" value={form.parkingType} onChange={(e) => set("parkingType", e.target.value)}>
              <option value="CAR">Car</option><option value="BIKE">Bike</option><option value="CAR_AND_BIKE">Car + Bike</option><option value="PAID">Paid</option>
            </select>
          )}
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasGenerator} onChange={(e) => set("hasGenerator", e.target.checked)} /> Generator</label>
          {form.hasGenerator && <input className="border rounded px-3 py-2" placeholder="Scope (full/common)" value={form.generatorScope} onChange={(e) => set("generatorScope", e.target.value)} />}
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasSecurityGuard} onChange={(e) => set("hasSecurityGuard", e.target.checked)} /> Security guard</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasCctv} onChange={(e) => set("hasCctv", e.target.checked)} /> CCTV</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasIntercom} onChange={(e) => set("hasIntercom", e.target.checked)} /> Intercom</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasRooftop} onChange={(e) => set("hasRooftop", e.target.checked)} /> Rooftop access</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hasSubmersiblePump} onChange={(e) => set("hasSubmersiblePump", e.target.checked)} /> Submersible pump</label>
        </section>

        <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
          {saving ? "Saving..." : "Save building & add apartments"}
        </button>
      </form>
    </main>
  );
}

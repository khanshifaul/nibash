"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apartmentsApi, buildingsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MdElevator, MdLocalParking, MdBolt, MdSecurity, MdVideocam, MdPhoneInTalk, MdRoofing, MdWaterDrop } from "react-icons/md";
import { FiArrowLeft, FiCheck, FiChevronRight } from "react-icons/fi";

type PropertyKind = "building" | "single_house" | "duplex" | "other";

type AddedUnit = {
  id: string;
  floorNumber: number;
  unitLabel: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  availabilityStatus: string;
  listed: boolean;
};

const steps = [
  { id: 1, title: "Building / Property" },
  { id: 2, title: "Floors" },
  { id: 3, title: "Units / Apartments" },
] as const;

export default function NewPropertyWizardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [propertyKind, setPropertyKind] = useState<PropertyKind>("building");
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ensuredFloors, setEnsuredFloors] = useState<number[]>([]);
  const [floorInput, setFloorInput] = useState("1");
  const [addedUnits, setAddedUnits] = useState<AddedUnit[]>([]);
  const [form, setForm] = useState({
    name: "", areaZone: "", roadBlock: "", addressLine: "", contactPhone: user?.phone ?? "",
    lat: "23.8103", lng: "90.4125", totalFloors: "10",
    hasElevator: false, elevatorCount: "1", hasParking: false, parkingType: "NONE" as "NONE" | "BIKE" | "CAR" | "CAR_AND_BIKE" | "PAID",
    hasGenerator: false, generatorScope: "", hasSecurityGuard: false, hasCctv: false,
    hasIntercom: false, hasRooftop: false, hasSubmersiblePump: false,
  });
  const [apt, setApt] = useState({
    floorNumber: "1", unitLabel: "", bedrooms: "2", bathrooms: "2", verandas: "1",
    diningRooms: "1", drawingRooms: "1", kitchens: "1", rentAmount: "2500000", serviceCharge: "0",
    securityDepositAmount: "0", availabilityStatus: "AVAILABLE" as "AVAILABLE" | "RENTED" | "MAINTENANCE" | "COMING_SOON", listed: true,
  });


  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyPropertyKind(kind: PropertyKind) {
    setPropertyKind(kind);
    if (kind === "single_house") {
      set("totalFloors", "1");
      setFloorInput("0");
      setApt((a) => ({ ...a, floorNumber: "0", unitLabel: "House" }));
    } else if (kind === "duplex") {
      set("totalFloors", "2");
      setFloorInput("1");
      setApt((a) => ({ ...a, floorNumber: "1", unitLabel: "Duplex" }));
    } else if (kind === "building") {
      set("totalFloors", "10");
      setFloorInput("1");
      setApt((a) => ({ ...a, floorNumber: "1", unitLabel: "" }));
    }
  }

  const buildingPayload = useMemo(() => ({
    name: form.name,
    areaZone: form.areaZone,
    roadBlock: form.roadBlock || undefined,
    addressLine: form.addressLine || undefined,
    contactPhone: form.contactPhone || undefined,
    lat: Number(form.lat),
    lng: Number(form.lng),
    totalFloors: Math.max(1, Number(form.totalFloors || 1)),
    hasElevator: form.hasElevator,
    elevatorCount: form.hasElevator ? Number(form.elevatorCount) || 1 : undefined,
    hasParking: form.hasParking,
    parkingType: form.parkingType as "NONE" | "BIKE" | "CAR" | "CAR_AND_BIKE" | "PAID",
    hasGenerator: form.hasGenerator,
    generatorScope: form.generatorScope || undefined,
    hasSecurityGuard: form.hasSecurityGuard,
    hasCctv: form.hasCctv,
    hasIntercom: form.hasIntercom,
    hasRooftop: form.hasRooftop,
    hasSubmersiblePump: form.hasSubmersiblePump,
  }), [form]);

  async function createBuilding(next: "finish" | "continue") {
    setError(null);
    setSaving(true);
    try {
      const building = await buildingsApi.create(buildingPayload);
      setBuildingId(building.id);
      if (next === "finish") {
        router.push(`/dashboard/properties/${building.id}`);
        return;
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create property");
    } finally {
      setSaving(false);
    }
  }

  async function ensureFloor() {
    if (!buildingId) return;
    const n = Number(floorInput);
    if (!Number.isInteger(n) || n < 0 || n > Math.max(1, Number(form.totalFloors || 1))) {
      setError(`Floor must be between 0 and ${Math.max(1, Number(form.totalFloors || 1))}.`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await buildingsApi.ensureFloor(buildingId, n);
      setEnsuredFloors((prev) => Array.from(new Set([...prev, n])).sort((a, b) => a - b));
      setApt((a) => ({ ...a, floorNumber: String(n) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add floor");
    } finally {
      setSaving(false);
    }
  }

  async function addApartment(e: React.FormEvent) {
    e.preventDefault();
    if (!buildingId) return;
    setError(null);
    setSaving(true);
    try {
      const payload = {
        floorNumber: Number(apt.floorNumber),
        unitLabel: apt.unitLabel,
        bedrooms: Number(apt.bedrooms || 0),
        bathrooms: Number(apt.bathrooms || 0),
        verandas: Number(apt.verandas || 0),
        diningRooms: Number(apt.diningRooms || 0),
        drawingRooms: Number(apt.drawingRooms || 0),
        kitchens: Number(apt.kitchens || 0),
        rentAmount: Number(apt.rentAmount),
        serviceCharge: Number(apt.serviceCharge || 0),
        securityDepositAmount: Number(apt.securityDepositAmount || 0),
        availabilityStatus: apt.availabilityStatus,
        publish: apt.listed,
      };
      const created = await apartmentsApi.create(buildingId, payload);
      setEnsuredFloors((prev) => Array.from(new Set([...prev, payload.floorNumber])).sort((a, b) => a - b));
      setAddedUnits((prev) => [...prev, {
        id: created.id,
        floorNumber: payload.floorNumber,
        unitLabel: payload.unitLabel,
        bedrooms: payload.bedrooms,
        bathrooms: payload.bathrooms,
        rentAmount: payload.rentAmount,
        availabilityStatus: payload.availabilityStatus,
        listed: !!payload.publish,
      }]);
      setApt((a) => ({ ...a, unitLabel: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setSaving(false);
    }
  }

  const kindHelp: Record<PropertyKind, string> = {
    building: "Multi-unit building. Add as many floors and units as needed (different floors can have different unit counts, e.g. 5 floors × 2 units + 5 floors × 3 units = 25).",
    single_house: "Single-story house rented as one home: usually 1 floor and 1 unit (the whole house). You can still add units later if needed.",
    duplex: "Duplex (two levels). If rented as one home across levels, add one unit and describe it clearly (e.g. unit label “Duplex”). If levels are rented separately, add one unit per level/floor.",
    other: "Other property type. Use floors/units to match your structure.",
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <Link href="/dashboard/properties" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><FiArrowLeft className="h-4 w-4" aria-hidden="true" /> My properties</Link>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 mb-2">Add property</h1>
      <p className="text-muted-foreground mb-6">Multistep: create the building/property first, then optionally add floors and units/apartments. You can save after step 1 (building only) and add floors/units later.</p>

      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {steps.map((s) => {
          const done = step > s.id || (s.id === 1 && !!buildingId);
          const active = step === s.id;
          return (
            <li key={s.id} className={`rounded-lg border p-3 ${active ? "border-primary bg-primary/5" : done ? "border-green-500/40 bg-green-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${done ? "bg-green-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <FiCheck className="h-3.5 w-3.5" aria-hidden="true" /> : s.id}
                </span>
                {s.title}
              </div>
            </li>
          );
        })}
      </ol>

      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

      {step === 1 && (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void createBuilding("continue"); }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  ["building", "Apartment building"],
                  ["single_house", "Single-story house"],
                  ["duplex", "Duplex house"],
                  ["other", "Other"],
                ] as [PropertyKind, string][]).map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => applyPropertyKind(kind)}
                    className={`text-left rounded-lg border p-3 text-sm transition-colors ${propertyKind === kind ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div className="font-medium">{label}</div>
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{kindHelp[propertyKind]}</p>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h2 className="font-semibold">Identity & location</h2>
            <div className="space-y-1.5">
              <Label htmlFor="name">Property / building name</Label>
              <Input id="name" placeholder={propertyKind === "single_house" ? "e.g. Green View House" : "e.g. Rose Garden Heights"} value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="areaZone">Area / Neighborhood</Label>
                <Input id="areaZone" placeholder="e.g. Dhanmondi" value={form.areaZone} onChange={(e) => set("areaZone", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totalFloors">Total floors/levels</Label>
                <Input id="totalFloors" type="text" inputMode="numeric" placeholder={propertyKind === "single_house" ? "e.g. 1" : "e.g. 10"} value={form.totalFloors} onChange={(e) => set("totalFloors", e.target.value.replace(/[^0-9]/g, ""))} required />
                <p className="text-xs text-muted-foreground">Single house: usually 1. Duplex: usually 2. Multi-story building: total floor count. You can add units on specific floor numbers (0 = ground where used).</p>
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
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">Amenities</h2>
            <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasElevator} onCheckedChange={(v) => set("hasElevator", !!v)} /> <MdElevator className="h-4 w-4 text-muted-foreground" /> <span>Lift/Elevator</span></label>
            {form.hasElevator && <div className="ml-6 space-y-1.5 max-w-xs"><Label htmlFor="elevatorCount">Number of elevators</Label><Input id="elevatorCount" type="text" inputMode="numeric" placeholder="e.g. 1" value={form.elevatorCount} onChange={(e) => set("elevatorCount", e.target.value.replace(/[^0-9]/g, ""))} /></div>}
            <label className="flex items-center gap-2 cursor-pointer"><Checkbox checked={form.hasParking} onCheckedChange={(v) => set("hasParking", !!v)} /> <MdLocalParking className="h-4 w-4 text-muted-foreground" /> <span>Parking</span></label>
            {form.hasParking && (
              <NativeSelect className="w-auto" value={form.parkingType} onChange={(e) => set("parkingType", e.target.value as typeof form.parkingType)}>
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="outline" disabled={saving || !form.name || !form.areaZone || !form.totalFloors} onClick={() => void createBuilding("finish")}>
              {saving ? "Saving..." : "Save property only"}
            </Button>
            <Button type="submit" disabled={saving || !form.name || !form.areaZone || !form.totalFloors}>
              {saving ? "Saving..." : "Save & continue to floors/units"} <FiChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">"Save property only" creates the building/property now; you can add floors and units later from its page.</p>
        </form>
      )}

      {step === 2 && buildingId && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Floors (optional step)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Building saved (total floors/levels: <strong>{Math.max(1, Number(form.totalFloors || 1))}</strong>). A floor is required before adding a unit on it. You can explicitly add/ensure floors here, or skip — creating a unit in the next step will create its floor automatically.
              </p>
              <p className="text-sm text-muted-foreground">
                Variable units per floor are supported: add as many units as you need to any floor (e.g. 2 units on floor 5 and 3 units on floor 6). Ground floor can be entered as <strong>0</strong> if applicable (allowed up to total floors).
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-end max-w-md">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="floorInput">Floor number</Label>
                  <Input id="floorInput" type="text" inputMode="numeric" placeholder={`0–${Math.max(1, Number(form.totalFloors || 1))}`} value={floorInput} onChange={(e) => setFloorInput(e.target.value.replace(/[^0-9]/g, ""))} />
                </div>
                <Button type="button" onClick={() => void ensureFloor()} disabled={saving || !floorInput}> {saving ? "Adding..." : "Add/ensure floor"} </Button>
              </div>
              {ensuredFloors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ensuredFloors.map((f) => <Badge key={f} variant="secondary">Floor {f}</Badge>)}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/properties/${buildingId}`)}>Finish (building/floors only)</Button>
                <Button type="button" onClick={() => setStep(3)}>Continue to add units <FiChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && buildingId && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add units / apartments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apartment/unit needs a floor (created automatically if missing). You can add multiple units to the same floor and different numbers of units on different floors.
              </p>
              {propertyKind === "single_house" && <p className="text-sm text-muted-foreground"><strong>Single-story house:</strong> typically add 1 unit (the whole house) on floor 0 or 1.</p>}
              {propertyKind === "duplex" && <p className="text-sm text-muted-foreground"><strong>Duplex:</strong> for one home across levels, add 1 unit and label it clearly (e.g. “Duplex”). For separately rented levels, add one unit per floor/level.</p>}

              <form onSubmit={addApartment} className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-floor">Floor number</Label>
                    <Input id="apt-floor" type="text" inputMode="numeric" placeholder={`0–${Math.max(1, Number(form.totalFloors || 1))}`} value={apt.floorNumber} onChange={(e) => setApt({ ...apt, floorNumber: e.target.value.replace(/[^0-9]/g, "") })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-unit">Unit label</Label>
                    <Input id="apt-unit" type="text" placeholder={propertyKind === "single_house" ? "e.g. House / Unit A" : "e.g. A-1"} value={apt.unitLabel} onChange={(e) => setApt({ ...apt, unitLabel: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-bedrooms">Bedrooms</Label>
                    <Input id="apt-bedrooms" type="text" inputMode="numeric" placeholder="e.g. 3" value={apt.bedrooms} onChange={(e) => setApt({ ...apt, bedrooms: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-bathrooms">Bathrooms</Label>
                    <Input id="apt-bathrooms" type="text" inputMode="numeric" placeholder="e.g. 2" value={apt.bathrooms} onChange={(e) => setApt({ ...apt, bathrooms: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-verandas">Verandas</Label>
                    <Input id="apt-verandas" type="text" inputMode="numeric" placeholder="e.g. 2" value={apt.verandas} onChange={(e) => setApt({ ...apt, verandas: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-dining">Dining rooms</Label>
                    <Input id="apt-dining" type="text" inputMode="numeric" placeholder="e.g. 1" value={apt.diningRooms} onChange={(e) => setApt({ ...apt, diningRooms: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-drawing">Drawing rooms</Label>
                    <Input id="apt-drawing" type="text" inputMode="numeric" placeholder="e.g. 1" value={apt.drawingRooms} onChange={(e) => setApt({ ...apt, drawingRooms: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-kitchens">Kitchens</Label>
                    <Input id="apt-kitchens" type="text" inputMode="numeric" placeholder="e.g. 1" value={apt.kitchens} onChange={(e) => setApt({ ...apt, kitchens: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-status">Status</Label>
                    <NativeSelect id="apt-status" value={apt.availabilityStatus} onChange={(e) => setApt({ ...apt, availabilityStatus: e.target.value as typeof apt.availabilityStatus })}>
                      <option value="AVAILABLE">Available for rent</option>
                      <option value="RENTED">Already rented</option>
                      <option value="MAINTENANCE">Maintenance / not available</option>
                      <option value="COMING_SOON">Coming soon</option>
                    </NativeSelect>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-7">
                    <Checkbox checked={apt.listed} onCheckedChange={(v) => setApt({ ...apt, listed: !!v })} />
                    <span className="text-sm">List publicly (visible in search when eligible)</span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Uncheck "List publicly" if you don&apos;t want this unit shown in public search/listings. Public search currently shows listed units with status Available or Coming soon. Sale/Sold are not yet modeled (rental-only schema).</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-rent">Monthly rent (BDT, minor units)</Label>
                    <Input id="apt-rent" type="text" inputMode="numeric" placeholder="e.g. 2500000" value={apt.rentAmount} onChange={(e) => setApt({ ...apt, rentAmount: e.target.value.replace(/[^0-9]/g, "") })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-service">Service charge (minor units)</Label>
                    <Input id="apt-service" type="text" inputMode="numeric" placeholder="e.g. 0" value={apt.serviceCharge} onChange={(e) => setApt({ ...apt, serviceCharge: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-deposit">Security deposit (minor units)</Label>
                    <Input id="apt-deposit" type="text" inputMode="numeric" placeholder="e.g. 0" value={apt.securityDepositAmount} onChange={(e) => setApt({ ...apt, securityDepositAmount: e.target.value.replace(/[^0-9]/g, "") })} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add unit"}</Button>
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>Back to floors</Button>
                </div>
              </form>

              {addedUnits.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Added units ({addedUnits.length})</h3>
                  <div className="space-y-2">
                    {addedUnits.map((u) => (
                      <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3 text-sm">
                        <div>
                          <span className="font-medium">Floor {u.floorNumber} · {u.unitLabel}</span>
                          <span className="text-muted-foreground"> — {u.bedrooms} bed, {u.bathrooms} bath, ৳{(u.rentAmount / 100).toLocaleString()}/mo · {u.availabilityStatus} · {u.listed ? "Listed" : "Unlisted"}</span>
                        </div>
                        <Badge variant="secondary">Saved</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No units added yet. You can finish without units and add them later.</p>
              )}

              <div className="pt-2">
                <Button type="button" onClick={() => router.push(`/dashboard/properties/${buildingId}`)}>Finish & view property</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

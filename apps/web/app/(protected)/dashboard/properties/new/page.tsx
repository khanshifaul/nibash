"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiCheck, FiChevronRight, FiImage, FiUpload } from "react-icons/fi";
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
import { apartmentsApi, buildingsApi, mediaApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { IMAGE_UPLOAD, validateImageFile } from "@/lib/image-upload";

const LocationPicker = dynamic(() => import("@/components/ui/location-picker"), { ssr: false });

type PropertyKind = "building" | "single_house" | "duplex" | "other";

type AddedUnit = {
  id: string;
  floorNumber: number;
  unitLabel: string;
  bedrooms: number;
  bathrooms: number;
  listingType: string;
  rentAmount: number;
  salePrice: number | null;
  availabilityStatus: string;
  listed: boolean;
  images: { id: string; url: string }[];
};

const steps = [
  { id: 1, title: "Property details" },
  { id: 2, title: "Units / Apartments" },
] as const;

async function uploadApartmentImage(apartmentId: string, file: File) {
  const presign = await mediaApi.presign({
    entity: "APARTMENT",
    entityId: apartmentId,
    contentType: file.type || "image/jpeg",
    fileName: file.name || "image.jpg",
  });
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  if (!put.ok) throw new Error("Image upload failed");
  const attached = await mediaApi.attachApartment(apartmentId, {
    storageKey: presign.storageKey,
    url: presign.url,
    roomTag: "OTHER",
  });
  return { id: (attached as { id?: string }).id ?? presign.storageKey, url: presign.url };
}

export default function NewPropertyWizardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [propertyKind, setPropertyKind] = useState<PropertyKind>("building");
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addedUnits, setAddedUnits] = useState<AddedUnit[]>([]);
  const [uploadingUnitId, setUploadingUnitId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [coverPhoto, setCoverPhoto] = useState<{ url: string; storageKey: string } | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    areaZone: "",
    roadBlock: "",
    addressLine: "",
    contactPhone: user?.phone ?? "",
    lat: "23.8103",
    lng: "90.4125",
    totalFloors: "10",
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

  const [apt, setApt] = useState({
    floorNumber: "1",
    unitLabel: "",
    bedrooms: "2",
    bathrooms: "2",
    verandas: "1",
    diningRooms: "1",
    drawingRooms: "1",
    kitchens: "1",
    listingType: "RENT" as "RENT" | "SALE",
    rentAmount: "2500000",
    salePrice: "",
    serviceCharge: "0",
    securityDepositAmount: "0",
    availabilityStatus: "AVAILABLE" as
      | "AVAILABLE"
      | "RENTED"
      | "MAINTENANCE"
      | "COMING_SOON"
      | "SOLD",
    listed: true,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyPropertyKind(kind: PropertyKind) {
    setPropertyKind(kind);
    if (kind === "single_house") {
      set("totalFloors", "1");
      setApt((a) => ({ ...a, floorNumber: "0", unitLabel: "House" }));
    } else if (kind === "duplex") {
      set("totalFloors", "2");
      setApt((a) => ({ ...a, floorNumber: "1", unitLabel: "Duplex" }));
    } else if (kind === "building") {
      set("totalFloors", "10");
      setApt((a) => ({ ...a, floorNumber: "1", unitLabel: "" }));
    }
  }

  const buildingPayload = useMemo(
    () => ({
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
      parkingType: form.parkingType,
      hasGenerator: form.hasGenerator,
      generatorScope: form.generatorScope || undefined,
      hasSecurityGuard: form.hasSecurityGuard,
      hasCctv: form.hasCctv,
      hasIntercom: form.hasIntercom,
      hasRooftop: form.hasRooftop,
      hasSubmersiblePump: form.hasSubmersiblePump,
    }),
    [form],
  );

  async function createBuilding(next: "finish" | "continue") {
    setError(null);
    setSaving(true);
    try {
      const building = await buildingsApi.create(buildingPayload);
      setBuildingId(building.id);
      if (coverFile) {
        try {
          await uploadCoverPhotoForBuilding(building.id, coverFile);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Property created, but cover photo upload failed",
          );
        }
      }
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
        listingType: apt.listingType,
        rentAmount: Number(apt.rentAmount || 0),
        salePrice: apt.listingType === "SALE" && apt.salePrice ? Number(apt.salePrice) : null,
        serviceCharge: Number(apt.serviceCharge || 0),
        securityDepositAmount: Number(apt.securityDepositAmount || 0),
        availabilityStatus: apt.availabilityStatus,
        publish: apt.listed,
      };
      const created = await apartmentsApi.create(buildingId, payload);
      setAddedUnits((prev) => [
        ...prev,
        {
          id: created.id,
          floorNumber: payload.floorNumber,
          unitLabel: payload.unitLabel,
          bedrooms: payload.bedrooms,
          bathrooms: payload.bathrooms,
          listingType: payload.listingType,
          rentAmount: payload.rentAmount,
          salePrice: payload.salePrice ?? null,
          availabilityStatus: payload.availabilityStatus,
          listed: !!payload.publish,
          images: [],
        },
      ]);
      setApt((a) => ({ ...a, unitLabel: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setSaving(false);
    }
  }

  function selectCoverFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    void (async () => {
      const validation = await validateImageFile(file);
      if (!validation.ok) {
        setError(validation.error);
        if (coverInputRef.current) coverInputRef.current.value = "";
        return;
      }
      setError(null);
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    })();
  }

  async function uploadCoverPhotoForBuilding(targetBuildingId: string, file: File) {
    const presign = await mediaApi.presign({
      entity: "BUILDING",
      entityId: targetBuildingId,
      contentType: file.type || "image/jpeg",
      fileName: file.name || "cover.jpg",
    });
    const put = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });
    if (!put.ok) throw new Error("Image upload failed");
    await mediaApi.attachBuilding(targetBuildingId, {
      storageKey: presign.storageKey,
      url: presign.url,
      isCover: true,
    });
    setCoverPhoto({ url: presign.url, storageKey: presign.storageKey });
  }

  async function uploadCoverPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file || !buildingId) return;
    setError(null);
    const validation = await validateImageFile(file);
    if (!validation.ok) {
      setError(validation.error);
      if (coverInputRef.current) coverInputRef.current.value = "";
      return;
    }
    setUploadingCover(true);
    try {
      await uploadCoverPhotoForBuilding(buildingId, file);
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover photo upload failed");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleUnitImages(unitId: string, files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploadingUnitId(unitId);
    try {
      for (const file of Array.from(files)) {
        const validation = await validateImageFile(file);
        if (!validation.ok) {
          setError(validation.error);
          continue;
        }
        const img = await uploadApartmentImage(unitId, file);
        setAddedUnits((prev) =>
          prev.map((u) => (u.id === unitId ? { ...u, images: [...u.images, img] } : u)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingUnitId(null);
      const input = fileInputRefs.current[unitId];
      if (input) input.value = "";
    }
  }

  const kindHelp: Record<PropertyKind, string> = {
    building:
      "Multi-unit building. Add as many units as needed on any floor (different floors can have different unit counts).",
    single_house:
      "Single-story house rented as one home: usually 1 floor and 1 unit (the whole house).",
    duplex: "Duplex (two levels). Rent as one home or add one unit per level/floor.",
    other: "Other property type. Use floors/units to match your structure.",
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <Link
        href="/dashboard/properties"
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <FiArrowLeft className="h-4 w-4" aria-hidden="true" /> My properties
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 mb-2">Add property</h1>
      <p className="text-muted-foreground mb-6">
        Create the property first, then add units/apartments. You can save after step 1 and add
        units later.
      </p>

      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {steps.map((s) => {
          const done = step > s.id || (s.id === 1 && !!buildingId);
          const active = step === s.id;
          return (
            <li
              key={s.id}
              className={`rounded-lg border p-3 ${active ? "border-primary bg-primary/5" : done ? "border-green-500/40 bg-green-500/5" : "border-border"}`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${done ? "bg-green-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
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
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            void createBuilding("continue");
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    ["building", "Apartment building"],
                    ["single_house", "Single-story house"],
                    ["duplex", "Duplex house"],
                    ["other", "Other"],
                  ] as [PropertyKind, string][]
                ).map(([kind, label]) => (
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
              <Input
                id="name"
                placeholder={
                  propertyKind === "single_house"
                    ? "e.g. Green View House"
                    : "e.g. Rose Garden Heights"
                }
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="areaZone">Area / Neighborhood</Label>
                <Input
                  id="areaZone"
                  placeholder="e.g. Dhanmondi"
                  value={form.areaZone}
                  onChange={(e) => set("areaZone", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totalFloors">Total floors/levels</Label>
                <Input
                  id="totalFloors"
                  type="text"
                  inputMode="numeric"
                  placeholder={propertyKind === "single_house" ? "e.g. 1" : "e.g. 10"}
                  value={form.totalFloors}
                  onChange={(e) => set("totalFloors", e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roadBlock">Road / Block</Label>
              <Input
                id="roadBlock"
                placeholder="e.g. Road 27, Block A"
                value={form.roadBlock}
                onChange={(e) => set("roadBlock", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addressLine">Full address</Label>
              <Input
                id="addressLine"
                placeholder="Street address"
                value={form.addressLine}
                onChange={(e) => set("addressLine", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input
                id="contactPhone"
                type="text"
                inputMode="tel"
                placeholder="e.g. +8801XXXXXXXXX"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
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
          </section>

          <section className="space-y-3">
            <h2 className="font-semibold">Cover photo</h2>
            <p className="text-sm text-muted-foreground">
              Optional. JPG/PNG/WebP, max 5MB, min 800x600, ratio 3:4 to 16:9.
            </p>
            <div
              className="rounded-lg border border-dashed p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => coverInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                selectCoverFile(e.dataTransfer.files);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") coverInputRef.current?.click();
              }}
            >
              {coverPreview ? (
                <div className="space-y-3">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="mx-auto h-44 w-full max-w-md rounded-lg border object-cover"
                  />
                  <p className="text-sm text-muted-foreground">Click or drop to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FiUpload className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm font-medium">Drop cover photo here or click to upload</p>
                  <p className="text-xs text-muted-foreground">
                    Used in property cards and previews
                  </p>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept={IMAGE_UPLOAD.accept.join(",")}
              className="hidden"
              onChange={(e) => {
                if (buildingId) void uploadCoverPhoto(e.target.files);
                else selectCoverFile(e.target.files);
              }}
            />
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">Amenities</h2>
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
          </section>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={saving || !form.name || !form.areaZone || !form.totalFloors}
              onClick={() => void createBuilding("finish")}
            >
              {saving ? "Saving..." : "Save property only"}
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.name || !form.areaZone || !form.totalFloors}
            >
              {saving ? "Saving..." : "Save & continue to units"}{" "}
              <FiChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      )}

      {step === 2 && buildingId && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cover photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Optional. JPG/PNG/WebP, max 5MB, min 800x600, ratio 3:4 to 16:9.
              </p>
              {coverPhoto ? (
                <img
                  src={coverPhoto.url}
                  alt="Building cover"
                  className="h-40 w-full max-w-md rounded-lg border object-cover"
                />
              ) : null}
              <div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept={IMAGE_UPLOAD.accept.join(",")}
                  className="hidden"
                  onChange={(e) => void uploadCoverPhoto(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <FiUpload className="mr-2 h-4 w-4" aria-hidden="true" />
                  {uploadingCover
                    ? "Uploading..."
                    : coverPhoto
                      ? "Replace cover photo"
                      : "Upload cover photo"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add units / apartments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add units on any floor. The floor is created automatically when needed.
              </p>

              <form onSubmit={addApartment} className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-floor">Floor number</Label>
                    <Input
                      id="apt-floor"
                      type="text"
                      inputMode="numeric"
                      placeholder={`0–${Math.max(1, Number(form.totalFloors || 1))}`}
                      value={apt.floorNumber}
                      onChange={(e) =>
                        setApt({ ...apt, floorNumber: e.target.value.replace(/[^0-9]/g, "") })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-unit">Unit label</Label>
                    <Input
                      id="apt-unit"
                      value={apt.unitLabel}
                      onChange={(e) => setApt({ ...apt, unitLabel: e.target.value })}
                      placeholder={
                        propertyKind === "single_house" ? "e.g. House / Unit A" : "e.g. A-1"
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-bedrooms">Bedrooms</Label>
                    <Input
                      id="apt-bedrooms"
                      type="text"
                      inputMode="numeric"
                      value={apt.bedrooms}
                      onChange={(e) =>
                        setApt({ ...apt, bedrooms: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-bathrooms">Bathrooms</Label>
                    <Input
                      id="apt-bathrooms"
                      type="text"
                      inputMode="numeric"
                      value={apt.bathrooms}
                      onChange={(e) =>
                        setApt({ ...apt, bathrooms: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-verandas">Verandas</Label>
                    <Input
                      id="apt-verandas"
                      type="text"
                      inputMode="numeric"
                      value={apt.verandas}
                      onChange={(e) =>
                        setApt({ ...apt, verandas: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-dining">Dining rooms</Label>
                    <Input
                      id="apt-dining"
                      type="text"
                      inputMode="numeric"
                      value={apt.diningRooms}
                      onChange={(e) =>
                        setApt({ ...apt, diningRooms: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-drawing">Drawing rooms</Label>
                    <Input
                      id="apt-drawing"
                      type="text"
                      inputMode="numeric"
                      value={apt.drawingRooms}
                      onChange={(e) =>
                        setApt({ ...apt, drawingRooms: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-kitchens">Kitchens</Label>
                    <Input
                      id="apt-kitchens"
                      type="text"
                      inputMode="numeric"
                      value={apt.kitchens}
                      onChange={(e) =>
                        setApt({ ...apt, kitchens: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-listing-type">Listing type</Label>
                    <NativeSelect
                      id="apt-listing-type"
                      value={apt.listingType}
                      onChange={(e) =>
                        setApt({ ...apt, listingType: e.target.value as "RENT" | "SALE" })
                      }
                    >
                      <option value="RENT">For rent</option>
                      <option value="SALE">For sale</option>
                    </NativeSelect>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-status">Status</Label>
                    <NativeSelect
                      id="apt-status"
                      value={apt.availabilityStatus}
                      onChange={(e) =>
                        setApt({
                          ...apt,
                          availabilityStatus: e.target.value as typeof apt.availabilityStatus,
                        })
                      }
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RENTED">Rented</option>
                      <option value="MAINTENANCE">Maintenance / not available</option>
                      <option value="COMING_SOON">Coming soon</option>
                      <option value="SOLD">Sold</option>
                    </NativeSelect>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-7">
                    <Checkbox
                      checked={apt.listed}
                      onCheckedChange={(v) => setApt({ ...apt, listed: !!v })}
                    />
                    <span className="text-sm">List publicly</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-rent">
                      {apt.listingType === "SALE"
                        ? "Sale price (BDT, minor units)"
                        : "Monthly rent (BDT, minor units)"}
                    </Label>
                    {apt.listingType === "SALE" ? (
                      <Input
                        id="apt-rent"
                        type="text"
                        inputMode="numeric"
                        value={apt.salePrice}
                        onChange={(e) =>
                          setApt({ ...apt, salePrice: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        required
                      />
                    ) : (
                      <Input
                        id="apt-rent"
                        type="text"
                        inputMode="numeric"
                        value={apt.rentAmount}
                        onChange={(e) =>
                          setApt({ ...apt, rentAmount: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        required
                      />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-service">Service charge (minor units)</Label>
                    <Input
                      id="apt-service"
                      type="text"
                      inputMode="numeric"
                      value={apt.serviceCharge}
                      onChange={(e) =>
                        setApt({ ...apt, serviceCharge: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-deposit">Security deposit (minor units)</Label>
                    <Input
                      id="apt-deposit"
                      type="text"
                      inputMode="numeric"
                      value={apt.securityDepositAmount}
                      onChange={(e) =>
                        setApt({
                          ...apt,
                          securityDepositAmount: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Add unit"}
                  </Button>
                </div>
              </form>

              {addedUnits.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Added units ({addedUnits.length})</h3>
                  <div className="space-y-3">
                    {addedUnits.map((u) => (
                      <div key={u.id} className="rounded border p-3 text-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-medium">
                              Floor {u.floorNumber} · {u.unitLabel}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              — {u.bedrooms} bed, {u.bathrooms} bath,{" "}
                              {u.listingType === "SALE"
                                ? `৳${((u.salePrice ?? 0) / 100).toLocaleString()} sale`
                                : `৳${(u.rentAmount / 100).toLocaleString()}/mo rent`}{" "}
                              · {u.availabilityStatus} · {u.listed ? "Listed" : "Unlisted"}
                            </span>
                          </div>
                          <Badge variant="secondary">Saved</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FiImage className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Apartment images
                            </span>
                          </div>
                          {u.images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {u.images.map((img) => (
                                <img
                                  key={img.id}
                                  src={img.url}
                                  alt={`Unit ${u.unitLabel}`}
                                  className="h-16 w-24 rounded border object-cover"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              ref={(el) => {
                                fileInputRefs.current[u.id] = el;
                              }}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => void handleUnitImages(u.id, e.target.files)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={uploadingUnitId === u.id}
                              onClick={() => fileInputRefs.current[u.id]?.click()}
                            >
                              <FiUpload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                              {uploadingUnitId === u.id ? "Uploading..." : "Upload images"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No units added yet. You can finish without units and add them later.
                </p>
              )}

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => router.push(`/dashboard/properties/${buildingId}`)}
                >
                  Finish & view property
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

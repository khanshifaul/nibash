"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCopy,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiImage,
  FiPlus,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import {
  MdBolt,
  MdElevator,
  MdLocalParking,
  MdRoofing,
  MdSecurity,
  MdVideocam,
} from "react-icons/md";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apartmentsApi, api, type Building, buildingsApi, mediaApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { validateImageFile } from "@/lib/image-upload";

type AptForm = {
  floorNumber: string;
  unitLabel: string;
  bedrooms: string;
  bathrooms: string;
  verandas: string;
  diningRooms: string;
  drawingRooms: string;
  kitchens: string;
  listingType: "RENT" | "SALE";
  rentAmount: string;
  salePrice: string;
  serviceCharge: string;
  securityDepositAmount: string;
};

const defaultApt: AptForm = {
  floorNumber: "1",
  unitLabel: "",
  bedrooms: "2",
  bathrooms: "2",
  verandas: "1",
  diningRooms: "1",
  drawingRooms: "1",
  kitchens: "1",
  listingType: "RENT",
  rentAmount: "2000000",
  salePrice: "",
  serviceCharge: "0",
  securityDepositAmount: "0",
};

export default function OwnerBuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [building, setBuilding] = useState<Building | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [apt, setApt] = useState<AptForm>(defaultApt);
  const [saving, setSaving] = useState(false);

  const [imageDialog, setImageDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [cloneDialog, setCloneDialog] = useState<{
    open: boolean;
    apartmentId: string | null;
    unitLabel: string;
    floorNumber: string;
  }>({ open: false, apartmentId: null, unitLabel: "", floorNumber: "1" });
  const [cloning, setCloning] = useState(false);

  const [aptImageDialog, setAptImageDialog] = useState<{
    open: boolean;
    apartmentId: string | null;
    unitLabel: string;
    images: { id: string; url: string }[];
  }>({ open: false, apartmentId: null, unitLabel: "", images: [] });
  const [uploadingAptImage, setUploadingAptImage] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/sign-in");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await buildingsApi.findOne(id);
      setBuilding(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && id) void load();
  }, [user, id, load]);

  const allUnits = useMemo(() => (building?.floors ?? []).flatMap((f) => f.apartments), [building]);
  const stats = useMemo(() => {
    const available = allUnits.filter((u) => u.availabilityStatus === "AVAILABLE").length;
    const rented = allUnits.filter((u) => u.availabilityStatus === "RENTED").length;
    const sold = allUnits.filter((u) => u.availabilityStatus === "SOLD").length;
    const unlisted = allUnits.filter(
      (u) => !(u as { publishedAt?: string | null }).publishedAt,
    ).length;
    return { available, rented, sold, unlisted, total: allUnits.length };
  }, [allUnits]);

  async function addApartment(e: React.FormEvent) {
    e.preventDefault();
    if (!building) return;
    setSaving(true);
    setError(null);
    try {
      await apartmentsApi.create(id, {
        floorNumber: Number(apt.floorNumber),
        unitLabel: apt.unitLabel.trim(),
        bedrooms: Number(apt.bedrooms || 0),
        bathrooms: Number(apt.bathrooms || 0),
        verandas: Number(apt.verandas || 0),
        diningRooms: Number(apt.diningRooms || 0),
        drawingRooms: Number(apt.drawingRooms || 0),
        kitchens: Number(apt.kitchens || 0),
        listingType: apt.listingType,
        rentAmount: Number(apt.rentAmount || 0),
        salePrice: apt.listingType === "SALE" && apt.salePrice ? Number(apt.salePrice) : undefined,
        serviceCharge: Number(apt.serviceCharge || 0),
        securityDepositAmount: Number(apt.securityDepositAmount || 0),
      });
      setShowAdd(false);
      setApt((a) => ({ ...a, unitLabel: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add apartment");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(apartmentId: string, availabilityStatus: string) {
    try {
      await api.patch(`/apartments/${apartmentId}/status`, { availabilityStatus });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function setListed(apartmentId: string, publish: boolean) {
    try {
      await apartmentsApi.update(apartmentId, { publish } as never);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  function openAptImages(
    apartmentId: string,
    unitLabel: string,
    images: { id: string; url: string }[],
  ) {
    setAptImageDialog({ open: true, apartmentId, unitLabel, images: images ?? [] });
  }

  async function uploadAptImages(files: FileList | null) {
    if (!files?.length || !aptImageDialog.apartmentId) return;
    setUploadingAptImage(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const validation = await validateImageFile(file);
        if (!validation.ok) {
          setError(validation.error);
          continue;
        }
        const presign = await mediaApi.presign({
          entity: "APARTMENT",
          entityId: aptImageDialog.apartmentId,
          contentType: file.type || "image/jpeg",
          fileName: file.name || "image.jpg",
        });
        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });
        if (!put.ok) throw new Error("Image upload failed");
        const attached = await mediaApi.attachApartment(aptImageDialog.apartmentId, {
          storageKey: presign.storageKey,
          url: presign.url,
          roomTag: "OTHER",
        });
        const attachedId = (attached as { id?: string }).id ?? presign.storageKey;
        setAptImageDialog((d) => ({
          ...d,
          images: [...d.images, { id: attachedId, url: presign.url }],
        }));
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload apartment image");
    } finally {
      setUploadingAptImage(false);
    }
  }

  async function deleteAptImage(imageId: string) {
    setError(null);
    try {
      await mediaApi.deleteApartmentImage(imageId);
      setAptImageDialog((d) => ({ ...d, images: d.images.filter((img) => img.id !== imageId) }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete apartment image");
    }
  }

  function openClone(apartmentId: string, currentFloor: number) {
    setCloneDialog({
      open: true,
      apartmentId,
      unitLabel: "",
      floorNumber: String(currentFloor),
    });
  }

  async function submitClone(e: React.FormEvent) {
    e.preventDefault();
    if (!cloneDialog.apartmentId) return;
    const unitLabel = cloneDialog.unitLabel.trim();
    const floorNumber = Number(cloneDialog.floorNumber);
    if (!unitLabel || !Number.isFinite(floorNumber)) return;
    setCloning(true);
    setError(null);
    try {
      await api.post(`/apartments/${cloneDialog.apartmentId}/clone`, { floorNumber, unitLabel });
      setCloneDialog({ open: false, apartmentId: null, unitLabel: "", floorNumber: "1" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clone failed");
    } finally {
      setCloning(false);
    }
  }

  async function attachCoverImage() {
    if (!newImageUrl.trim()) return;
    setUploadingImage(true);
    setError(null);
    try {
      await mediaApi.attachBuilding(id, {
        storageKey: newImageUrl.trim(),
        url: newImageUrl.trim(),
        caption: newImageCaption.trim() || undefined,
        isCover: true,
      });
      setImageDialog(false);
      setNewImageUrl("");
      setNewImageCaption("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to attach image");
    } finally {
      setUploadingImage(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 space-y-3 sm:mb-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full sm:col-span-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-3">
                    <Skeleton className="mx-auto h-7 w-10" />
                    <Skeleton className="mx-auto h-3 w-14" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-36" />
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (!building) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Property not found</CardTitle>
            <CardDescription>
              {error || "This property could not be loaded or you don’t have access."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/properties">
                <FiArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to my properties
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const amenityBadges = [
    building.hasElevator && {
      icon: MdElevator,
      label: `Lift${building.elevatorCount ? ` (${building.elevatorCount})` : ""}`,
    },
    building.hasParking && { icon: MdLocalParking, label: `Parking (${building.parkingType})` },
    building.hasGenerator && { icon: MdBolt, label: "Generator" },
    building.hasSecurityGuard && { icon: MdSecurity, label: "Security guard" },
    building.hasCctv && { icon: MdVideocam, label: "CCTV" },
    building.hasRooftop && { icon: MdRoofing, label: "Rooftop" },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string }[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8">
        <Link
          href="/dashboard/properties"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
          My properties
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {building.name}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              {building.areaZone}
              {building.addressLine ? ` · ${building.addressLine}` : ""} · {building.totalFloors}{" "}
              floors · {stats.total} units
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="cursor-pointer">
              <Link href={`/dashboard/properties/${id}/edit`}>
                <FiEdit2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Edit building
              </Link>
            </Button>
            <Button
              onClick={() => setImageDialog(true)}
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <FiImage className="mr-2 h-4 w-4" aria-hidden="true" />
              Add cover photo
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Building details</CardTitle>
              <CardDescription>Core information and contact for this property.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Name
                </p>
                <p className="text-sm font-medium leading-6">{building.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Location
                </p>
                <p className="text-sm leading-6">{building.addressLine || building.areaZone}</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Contact phone
                </p>
                <p className="text-sm leading-6">{building.contactPhone || "Not set"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Amenities</CardTitle>
              <CardDescription>Facilities available in this building.</CardDescription>
            </CardHeader>
            <CardContent>
              {amenityBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {amenityBadges.map(({ icon: Icon, label }) => (
                    <Badge key={label} variant="secondary" className="gap-1.5 px-2.5 py-1">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No amenities recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="lg:sticky lg:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">At a glance</CardTitle>
              <CardDescription>Unit status and listing visibility.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/20 p-3 text-center">
                  <div className="text-2xl font-bold tabular-nums">{stats.available}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Available</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-center">
                  <div className="text-2xl font-bold tabular-nums">{stats.rented}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Rented</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-center">
                  <div className="text-2xl font-bold tabular-nums">{stats.sold}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Sold</div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 text-center">
                  <div className="text-2xl font-bold tabular-nums">{stats.unlisted}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Unlisted</div>
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-center text-xs text-muted-foreground">
                {stats.total} total unit{stats.total === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="mt-10 space-y-4 sm:mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Units by floor</h2>
            <p className="text-sm text-muted-foreground">
              Manage availability, listing visibility, and unit copies.
            </p>
          </div>
          <Button
            onClick={() => setShowAdd((s) => !s)}
            variant={showAdd ? "outline" : "default"}
            className="cursor-pointer"
          >
            <FiPlus className="mr-2 h-4 w-4" aria-hidden="true" />
            {showAdd ? "Cancel" : "Add apartment"}
          </Button>
        </div>

        {showAdd && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Add apartment/unit</CardTitle>
              <CardDescription>
                Create a unit on an existing floor (floors are created automatically if needed).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addApartment} className="space-y-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-floor">Floor</Label>
                    <Input
                      id="apt-floor"
                      type="text"
                      inputMode="numeric"
                      placeholder={`0–${building.totalFloors}`}
                      value={apt.floorNumber}
                      onChange={(e) =>
                        setApt({ ...apt, floorNumber: e.target.value.replace(/[^0-9]/g, "") })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="apt-unit">Unit label</Label>
                    <Input
                      id="apt-unit"
                      type="text"
                      placeholder="e.g. A-1"
                      value={apt.unitLabel}
                      onChange={(e) => setApt({ ...apt, unitLabel: e.target.value })}
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="apt-listing-type">Listing type</Label>
                    <select
                      id="apt-listing-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={apt.listingType}
                      onChange={(e) =>
                        setApt({ ...apt, listingType: e.target.value as "RENT" | "SALE" })
                      }
                    >
                      <option value="RENT">For rent</option>
                      <option value="SALE">For sale</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="apt-price">
                      {apt.listingType === "SALE"
                        ? "Sale price (BDT, minor units)"
                        : "Monthly rent (BDT, minor units)"}
                    </Label>
                    {apt.listingType === "SALE" ? (
                      <Input
                        id="apt-price"
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 1250000000"
                        value={apt.salePrice}
                        onChange={(e) =>
                          setApt({ ...apt, salePrice: e.target.value.replace(/[^0-9]/g, "") })
                        }
                        required
                      />
                    ) : (
                      <Input
                        id="apt-price"
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 2500000"
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

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="cursor-pointer">
                    {saving ? "Saving..." : "Save apartment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {building.floors.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="font-medium">No floors or units yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Add an apartment to create floors in the building hierarchy.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {building.floors.map((floor) => (
              <Card key={floor.id} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/20 px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">Floor {floor.floorNumber}</CardTitle>
                    <Badge variant="secondary" className="font-normal">
                      {floor.apartments.length} unit{floor.apartments.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {floor.apartments.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
                      No apartments on this floor.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {floor.apartments.map((a) => {
                        const published = Boolean(
                          (a as { publishedAt?: string | null }).publishedAt,
                        );
                        return (
                          <div
                            key={a.id}
                            className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">Unit {a.unitLabel}</span>
                                <Badge
                                  variant={
                                    a.availabilityStatus === "AVAILABLE" ? "default" : "secondary"
                                  }
                                >
                                  {a.availabilityStatus}
                                </Badge>
                                <Badge variant={published ? "outline" : "secondary"}>
                                  {published ? "Listed" : "Unlisted"}
                                </Badge>
                                <Badge variant="outline">
                                  {a.listingType === "SALE" ? "For sale" : "For rent"}
                                </Badge>
                              </div>
                              <p className="text-sm leading-6 text-muted-foreground">
                                {a.bedrooms} bed · {a.bathrooms} bath · {a.verandas} veranda ·{" "}
                                {a.listingType === "SALE"
                                  ? `৳${((a.salePrice ?? 0) / 100).toLocaleString()} (sale)`
                                  : `৳${(a.rentAmount / 100).toLocaleString()}/mo (rent)`}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
                              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                                <span>Status</span>
                                <select
                                  className="h-9 min-w-[160px] cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground"
                                  value={a.availabilityStatus}
                                  onChange={(e) => void setStatus(a.id, e.target.value)}
                                >
                                  <option value="AVAILABLE">Available</option>
                                  <option value="RENTED">Rented</option>
                                  <option value="MAINTENANCE">Maintenance</option>
                                  <option value="COMING_SOON">Coming soon</option>
                                  <option value="SOLD">Sold</option>
                                </select>
                              </label>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 cursor-pointer"
                                onClick={() => void setListed(a.id, !published)}
                              >
                                {published ? (
                                  <FiEyeOff className="mr-2 h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <FiEye className="mr-2 h-4 w-4" aria-hidden="true" />
                                )}
                                {published ? "Unlist" : "List publicly"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 cursor-pointer"
                                onClick={() =>
                                  openAptImages(
                                    a.id,
                                    a.unitLabel,
                                    (a.images ?? []).map((img: { id: string; url: string }) => ({
                                      id: img.id,
                                      url: img.url,
                                    })),
                                  )
                                }
                              >
                                <FiImage className="mr-2 h-4 w-4" aria-hidden="true" />
                                Images
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 cursor-pointer"
                                onClick={() => openClone(a.id, floor.floorNumber)}
                              >
                                <FiCopy className="mr-2 h-4 w-4" aria-hidden="true" />
                                Clone
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add cover photo</DialogTitle>
            <DialogDescription>
              Paste the public URL of an uploaded building image.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cover-url">Image URL</Label>
              <Input
                id="cover-url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cover-caption">Caption (optional)</Label>
              <Input
                id="cover-caption"
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                placeholder="e.g. Front view"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setImageDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              onClick={attachCoverImage}
              disabled={uploadingImage || !newImageUrl.trim()}
            >
              {uploadingImage ? "Attaching…" : "Attach cover photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={aptImageDialog.open}
        onOpenChange={(open) =>
          !open && setAptImageDialog({ open: false, apartmentId: null, unitLabel: "", images: [] })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unit {aptImageDialog.unitLabel} images</DialogTitle>
            <DialogDescription>Upload and manage images for this apartment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {aptImageDialog.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {aptImageDialog.images.map((img) => (
                  <div key={img.id} className="relative group rounded border overflow-hidden">
                    <img
                      src={img.url}
                      alt={`Unit ${aptImageDialog.unitLabel}`}
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => void deleteAptImage(img.id)}
                      aria-label="Delete image"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No images yet.</p>
            )}
            <div>
              <input
                id="apt-image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void uploadAptImages(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadingAptImage}
                onClick={() => document.getElementById("apt-image-upload")?.click()}
              >
                <FiUpload className="mr-2 h-4 w-4" aria-hidden="true" />
                {uploadingAptImage ? "Uploading..." : "Upload images"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cloneDialog.open}
        onOpenChange={(open) =>
          setCloneDialog((d) =>
            open
              ? { ...d, open }
              : { open: false, apartmentId: null, unitLabel: "", floorNumber: "1" },
          )
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone apartment</DialogTitle>
            <DialogDescription>
              Copy specs to another floor/unit. Images and availability are reset.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitClone} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clone-unit">New unit label</Label>
              <Input
                id="clone-unit"
                value={cloneDialog.unitLabel}
                onChange={(e) => setCloneDialog((d) => ({ ...d, unitLabel: e.target.value }))}
                placeholder="e.g. A-2"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clone-floor">Target floor number</Label>
              <Input
                id="clone-floor"
                type="text"
                inputMode="numeric"
                value={cloneDialog.floorNumber}
                onChange={(e) =>
                  setCloneDialog((d) => ({
                    ...d,
                    floorNumber: e.target.value.replace(/[^0-9]/g, ""),
                  }))
                }
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  setCloneDialog({
                    open: false,
                    apartmentId: null,
                    unitLabel: "",
                    floorNumber: "1",
                  })
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={cloning || !cloneDialog.unitLabel.trim()}
              >
                {cloning ? "Cloning…" : "Clone unit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, buildingsApi, apartmentsApi, mediaApi, type Building } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MdElevator, MdLocalParking, MdBolt, MdSecurity, MdVideocam, MdRoofing } from "react-icons/md";

export default function OwnerBuildingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const [building, setBuilding] = useState<Building | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [apt, setApt] = useState({
    floorNumber: 1, unitLabel: "", bedrooms: 2, bathrooms: 2, verandas: 1,
    diningRooms: 1, drawingRooms: 1, kitchens: 1, rentAmount: 2000000, serviceCharge: 0,
    securityDepositAmount: 0,
  });
  const [saving, setSaving] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    try {
      const data = await buildingsApi.findOne(id);
      setBuilding(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load building");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (user && id) load(); }, [user, id, load]);

  async function addApartment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await apartmentsApi.create(id, apt);
      setShowAdd(false);
      setApt((a) => ({ ...a, unitLabel: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add apartment");
    } finally { setSaving(false); }
  }

  async function toggleStatus(apartmentId: string, current: string) {
    const next = current === "AVAILABLE" ? "RENTED" : "AVAILABLE";
    try {
      await api.patch(`/apartments/${apartmentId}/status`, { availabilityStatus: next });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function cloneApartment(apartmentId: string, currentFloor: number) {
    const unitLabel = prompt("New unit label for cloned flat:");
    if (!unitLabel) return;
    const floorStr = prompt("Target floor number:", String(currentFloor + 1));
    const floorNumber = Number(floorStr ?? currentFloor + 1);
    try {
      await api.post(`/apartments/${apartmentId}/clone`, { floorNumber, unitLabel });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clone failed");
    }
  }

  async function attachCoverImage() {
    if (!newImageUrl.trim()) return;
    setUploadingImage(true);
    try {
      await mediaApi.attachBuilding(id, {
        storageKey: newImageUrl,
        url: newImageUrl,
        caption: newImageCaption || undefined,
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

  if (loading || !user || !building) return <div className="p-8">Loading...</div>;

  const allUnits = building.floors.flatMap((f) => f.apartments);
  const availableCount = allUnits.filter((u) => u.availabilityStatus === "AVAILABLE").length;
  const rentedCount = allUnits.filter((u) => u.availabilityStatus === "RENTED").length;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard/properties" className="text-sm text-muted-foreground hover:text-foreground">← My properties</Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mt-4">
          <div>
            <h1 className="text-2xl font-bold">{building.name}</h1>
            <p className="text-gray-600">{building.areaZone} • {building.totalFloors} floors • {allUnits.length} units</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/properties/${id}/edit`} className="text-sm font-medium hover:underline">Edit building</Link>
            <Button onClick={() => setImageDialog(true)} variant="outline" size="sm">
              Add cover photo
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Building details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Name</span>
              </div>
              <p className="text-sm">{building.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-sm">{building.addressLine ?? building.areaZone}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Contact phone</span>
              </div>
              <p className="text-sm">{building.contactPhone ?? "Not set"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {building.hasElevator && <Badge variant="secondary" className="gap-1.5"><MdElevator className="h-3.5 w-3.5" />Lift ({building.elevatorCount ?? 1})</Badge>}
                {building.hasParking && <Badge variant="secondary" className="gap-1.5"><MdLocalParking className="h-3.5 w-3.5" />Parking ({building.parkingType})</Badge>}
                {building.hasGenerator && <Badge variant="secondary" className="gap-1.5"><MdBolt className="h-3.5 w-3.5" />Generator</Badge>}
                {building.hasSecurityGuard && <Badge variant="secondary" className="gap-1.5"><MdSecurity className="h-3.5 w-3.5" />Security guard</Badge>}
                {building.hasCctv && <Badge variant="secondary" className="gap-1.5"><MdVideocam className="h-3.5 w-3.5" />CCTV</Badge>}
                {building.hasRooftop && <Badge variant="secondary" className="gap-1.5"><MdRoofing className="h-3.5 w-3.5" />Rooftop</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{availableCount}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
                <Separator />
                <div className="text-center">
                  <div className="text-2xl font-bold">{rentedCount}</div>
                  <div className="text-xs text-muted-foreground">Rented</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Units by floor</h2>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm"
        >
          {showAdd ? "Cancel" : "Add apartment"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addApartment} className="border rounded p-4 mb-6 space-y-3">
          <h3 className="font-semibold">Add apartment (Stage B)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="text-sm">
              Floor <Input type="number" min={0} max={building.totalFloors} value={apt.floorNumber} onChange={(e) => setApt({ ...apt, floorNumber: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              Unit label <Input value={apt.unitLabel} onChange={(e) => setApt({ ...apt, unitLabel: e.target.value })} required />
            </label>
            <label className="text-sm">
              Bedrooms <Input type="number" min={0} value={apt.bedrooms} onChange={(e) => setApt({ ...apt, bedrooms: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              Bathrooms <Input type="number" min={0} value={apt.bathrooms} onChange={(e) => setApt({ ...apt, bathrooms: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              Verandas <Input type="number" min={0} value={apt.verandas} onChange={(e) => setApt({ ...apt, verandas: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              Dining <Input type="number" min={0} value={apt.diningRooms} onChange={(e) => setApt({ ...apt, diningRooms: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              Drawing <Input type="number" min={0} value={apt.drawingRooms} onChange={(e) => setApt({ ...apt, drawingRooms: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              Kitchens <Input type="number" min={0} value={apt.kitchens} onChange={(e) => setApt({ ...apt, kitchens: Number(e.target.value) })} />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              Rent (minor units) <Input type="number" min={0} value={apt.rentAmount} onChange={(e) => setApt({ ...apt, rentAmount: Number(e.target.value) })} required />
            </label>
            <label className="text-sm">
              Service charge <Input type="number" min={0} value={apt.serviceCharge} onChange={(e) => setApt({ ...apt, serviceCharge: Number(e.target.value) })} />
            </label>
            <label className="text-sm">
              Security deposit <Input type="number" min={0} value={apt.securityDepositAmount} onChange={(e) => setApt({ ...apt, securityDepositAmount: Number(e.target.value) })} />
            </label>
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save apartment"}</Button>
        </form>
      )}

      {building.floors.length === 0 ? (
        <p className="text-gray-600">No floors/apartments yet. Add an apartment to create floors in the hierarchy.</p>
      ) : (
        <div className="space-y-4">
          {building.floors.map((floor) => (
            <div key={floor.id} className="border rounded p-4">
              <h3 className="font-semibold mb-2">Floor {floor.floorNumber}</h3>
              {floor.apartments.length === 0 ? (
                <p className="text-sm text-gray-600">No apartments on this floor.</p>
              ) : (
                <div className="space-y-2">
                  {floor.apartments.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border rounded p-3">
                      <div>
                        <div className="font-medium">Unit {a.unitLabel}</div>
                        <div className="text-sm text-gray-600">{a.bedrooms} bed • {a.bathrooms} bath • {a.verandas} veranda • ৳{(a.rentAmount / 100).toLocaleString()}/mo • {a.availabilityStatus}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(a.id, a.availabilityStatus)}>Toggle status</Button>
                        <Button size="sm" variant="outline" onClick={() => cloneApartment(a.id, floor.floorNumber)}>Clone</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image dialog */}
      <Dialog open={imageDialog} onOpenChange={setImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add cover photo</DialogTitle>
            <DialogDescription>Paste the public URL of an uploaded building image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://..." />
            <Input value={newImageCaption} onChange={(e) => setNewImageCaption(e.target.value)} placeholder="Caption (optional)" />
            <Button onClick={attachCoverImage} disabled={uploadingImage} className="w-full">
              {uploadingImage ? "Attaching…" : "Attach cover photo"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

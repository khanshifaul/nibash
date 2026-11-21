"use client";

import { Building2, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, type ListingDetail, searchApi } from "@/lib/api";
import { authApi } from "@/lib/api/services";
import { useAuth } from "@/lib/auth";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user, refresh } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inquiryMsg, setInquiryMsg] = useState(
    "I am interested in this apartment. Please let me know about a visit.",
  );
  const [inquiryStatus, setInquiryStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [inquiryMsgText, setInquiryMsgText] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [signInOpen, setSignInOpen] = useState(false);
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const loadListing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchApi.getListing(id);
      setListing(data);
      setActiveImage(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  const buildingCover =
    listing?.building.images?.find((img) => img.isCover) ?? listing?.building.images?.[0];
  const apartmentImages = (() => {
    const apt = listing?.images ?? [];
    if (!buildingCover) return apt;
    const coverAsGallery = {
      id: `building-cover-${buildingCover.id}`,
      url: buildingCover.url,
      roomTag: "COVER",
    } as (typeof apt)[number];
    const seen = new Set(apt.map((img) => img.url));
    return seen.has(buildingCover.url) ? apt : [coverAsGallery, ...apt];
  })();

  const isSale = listing?.listingType === "SALE";
  const priceMajor = listing ? (isSale ? (listing.salePrice ?? 0) : listing.rentAmount) / 100 : 0;
  const serviceCharge = listing ? listing.serviceCharge / 100 : 0;
  const deposit = listing ? listing.securityDepositAmount / 100 : 0;
  const moveInTotal = isSale ? priceMajor : priceMajor + serviceCharge + deposit;

  async function submitSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError(null);
    setSigningIn(true);
    try {
      await authApi.login({ email: signInEmail, password: signInPassword });
      await refresh();
      setSignInOpen(false);
      setSignInPassword("");
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSigningIn(false);
    }
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;
    if (!user) {
      setSignInOpen(true);
      return;
    }
    setInquiryStatus("sending");
    setInquiryMsgText(null);
    try {
      await api.post(`/apartments/${listing.id}/inquiries`, { message: inquiryMsg });
      setInquiryStatus("ok");
      setInquiryMsgText("Inquiry sent. The owner will contact you.");
    } catch (e) {
      setInquiryStatus("error");
      setInquiryMsgText((e as Error).message);
    }
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 rounded-lg w-1/3" />
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold">{error || "Property not found"}</h2>
        <p className="text-muted-foreground mt-2">
          <Link href="/search" className="underline">
            Browse properties
          </Link>
        </p>
      </main>
    );
  }

  const contact = listing.contact;
  const ownerName = contact?.name ?? "Property owner";

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gallery + main info */}
        <section className="lg:col-span-8 space-y-6">
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-video group">
            {apartmentImages.length > 0 ? (
              <>
                <img
                  src={apartmentImages[activeImage]?.url ?? ""}
                  alt={apartmentImages[activeImage]?.roomTag ?? "Property image"}
                  className="w-full h-full object-cover"
                />
                {apartmentImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImage(
                          (i) => (i - 1 + apartmentImages.length) % apartmentImages.length,
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/45 text-white hover:bg-black/60 flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="Previous image"
                    >
                      <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImage((i) => (i + 1) % apartmentImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/45 text-white hover:bg-black/60 flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="Next image"
                    >
                      <FiChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/55 text-white text-xs px-2 py-1 rounded-md">
                      {activeImage + 1} / {apartmentImages.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Building2 className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-3 left-3 bg-black/55 px-2 py-1 rounded text-xs text-white font-medium">
              {listing.availabilityStatus.replace(/_/g, " ")}
            </div>
          </div>

          {apartmentImages.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {apartmentImages.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`relative rounded-md overflow-hidden border aspect-square cursor-pointer transition-all ${idx === activeImage ? "ring-2 ring-primary border-primary" : "border-transparent hover:border-muted-foreground/30"}`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img.url}
                    alt={img.roomTag ?? `Property image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-start justify-between gap-6 mb-4">
            <div>
              <h1 className="text-3xl font-bold">{listing.unitLabel}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" /> {listing.building.areaZone}
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold">
                ৳{priceMajor.toLocaleString()}
                {isSale ? "" : "/mo"}
              </span>
              <p className="text-sm text-muted-foreground">
                + ৳{serviceCharge.toLocaleString()} service charge
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              ["Bedrooms", listing.bedrooms],
              ["Bathrooms", listing.bathrooms],
              ["Verandas", listing.verandas],
              ["Floor", listing.floorNumber ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded p-3 bg-muted">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {label}
                </div>
                <div className="text-base font-semibold">{String(value)}</div>
              </div>
            ))}
          </div>

          <Separator />

          <h3 className="text-lg font-semibold mb-2">Cost breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isSale ? "Sale price" : "Monthly rent"}</span>
              <span className="font-medium">
                ৳{priceMajor.toLocaleString()}
                {isSale ? "" : "/mo"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Service charge</span>
              <span className="font-medium">৳{serviceCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Security deposit</span>
              <span className="font-medium">৳{deposit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Move-in total</span>
              <span>৳{moveInTotal.toLocaleString()}</span>
            </div>
          </div>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="floorplan">Floor plan</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Unit", value: listing.unitLabel },
                  {
                    label: "Floor",
                    value: listing.floorNumber != null ? `${listing.floorNumber}` : "—",
                  },
                  { label: "Bedrooms", value: `${listing.bedrooms}` },
                  {
                    label: "Bathrooms",
                    value: `${listing.bathrooms}${listing.attachedBathrooms ? ` (${listing.attachedBathrooms} attached)` : ""}`,
                  },
                  { label: "Dining rooms", value: `${listing.diningRooms}` },
                  { label: "Drawing rooms", value: `${listing.drawingRooms}` },
                  { label: "Kitchens", value: `${listing.kitchens}` },
                  { label: "Verandas", value: `${listing.verandas}` },
                  { label: "Size", value: listing.sizeSqft ? `${listing.sizeSqft} sqft` : "—" },
                  { label: "Facing", value: listing.facing || "—" },
                  { label: "Gas", value: listing.gasType?.replace(/_/g, " ") || "—" },
                  {
                    label: "Utility billing",
                    value: listing.utilityBillingType?.replace(/_/g, " ") || "—",
                  },
                  { label: "Available from", value: formatDate(listing.availableFrom) },
                  {
                    label: "Preferred tenants",
                    value:
                      listing.preferredTenantTypes?.length > 0
                        ? listing.preferredTenantTypes.map((t) => t.replace(/_/g, " ")).join(", ")
                        : "—",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{listing.building.name}</span> ·{" "}
                {listing.building.areaZone} · {listing.building.totalFloors} floors
              </div>
            </TabsContent>
            <TabsContent value="amenities" className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "Lift", has: listing.building.hasElevator, Icon: MdElevator },
                { label: "Parking", has: listing.building.hasParking, Icon: MdLocalParking },
                { label: "Generator", has: listing.building.hasGenerator, Icon: MdBolt },
                { label: "Security", has: listing.building.hasSecurityGuard, Icon: MdSecurity },
                { label: "CCTV", has: listing.building.hasCctv, Icon: MdVideocam },
                { label: "Rooftop", has: listing.building.hasRooftop, Icon: MdRoofing },
              ]
                .filter((a) => a.has)
                .map((a) => (
                  <Badge key={a.label} variant="secondary" className="gap-1.5">
                    <a.Icon className="h-3.5 w-3.5" />
                    {a.label}
                  </Badge>
                ))}
            </TabsContent>
            <TabsContent value="floorplan" className="mt-4">
              <div className="rounded-xl border bg-muted/20 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Unit schematic</p>
                    <p className="text-xs text-muted-foreground">
                      Generated from unit details ·{" "}
                      {listing.sizeSqft ? `${listing.sizeSqft} sqft` : "Size not specified"}
                    </p>
                  </div>
                  <Badge variant="secondary">Floor {listing.floorNumber ?? "—"}</Badge>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 auto-rows-[72px] sm:auto-rows-[84px]">
                  {Array.from({ length: Math.max(1, listing.bedrooms) }).map((_, i) => (
                    <div
                      key={`bed-${i}`}
                      className="col-span-2 row-span-2 rounded-lg border border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30 p-3 flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Bedroom {i + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Sleeping area</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(1, listing.drawingRooms) }).map((_, i) => (
                    <div
                      key={`draw-${i}`}
                      className="col-span-2 row-span-1 rounded-lg border border-violet-200 bg-violet-50/70 dark:border-violet-900/60 dark:bg-violet-950/30 p-3 flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                        Drawing {listing.drawingRooms > 1 ? i + 1 : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Living</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(1, listing.diningRooms) }).map((_, i) => (
                    <div
                      key={`din-${i}`}
                      className="col-span-2 row-span-1 rounded-lg border border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30 p-3 flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Dining {listing.diningRooms > 1 ? i + 1 : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Shared</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(1, listing.kitchens) }).map((_, i) => (
                    <div
                      key={`kit-${i}`}
                      className="col-span-2 row-span-1 rounded-lg border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-3 flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        Kitchen {listing.kitchens > 1 ? i + 1 : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Utility</span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(1, listing.bathrooms) }).map((_, i) => (
                    <div
                      key={`bath-${i}`}
                      className="col-span-1 sm:col-span-2 row-span-1 rounded-lg border border-cyan-200 bg-cyan-50/70 dark:border-cyan-900/60 dark:bg-cyan-950/30 p-3 flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                        Bath {i + 1}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {i < listing.attachedBathrooms ? "Attached" : "Common"}
                      </span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, listing.verandas) }).map((_, i) => (
                    <div
                      key={`ver-${i}`}
                      className="col-span-1 sm:col-span-2 row-span-1 rounded-lg border border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30 p-3 flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                        Veranda {listing.verandas > 1 ? i + 1 : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Outdoor</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Schematic layout for quick understanding; exact dimensions and positions may vary.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Send inquiry</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <form onSubmit={submitInquiry} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block" htmlFor="inquiry-message">
                      Message
                    </label>
                    <Textarea
                      id="inquiry-message"
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      rows={4}
                      required
                      className="resize-y min-h-[110px]"
                      placeholder="Tell the owner what you need, preferred visit time, or any questions..."
                    />
                  </div>
                  {inquiryMsgText && (
                    <div
                      className={`rounded-md px-3 py-2 text-sm ${inquiryStatus === "ok" ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"}`}
                    >
                      {inquiryMsgText}
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={inquiryStatus === "sending"}
                    className="w-full sm:w-auto sm:min-w-[160px]"
                  >
                    {inquiryStatus === "sending" ? "Sending…" : "Send inquiry"}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2"
                    onClick={() => setSignInOpen(true)}
                  >
                    Sign in
                  </button>{" "}
                  to send an inquiry to the owner.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: contact + building info */}
        <section className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">{contact?.phone ?? "Not listed"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">{contact?.email ?? "Not listed"}</div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <button
                    type="button"
                    className="text-primary underline underline-offset-2"
                    onClick={() => setSignInOpen(true)}
                  >
                    Sign in
                  </button>{" "}
                  to view contact info.
                </p>
              )}
              <div className="text-sm text-muted-foreground">Owner: {ownerName}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Building info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm border-b pb-2">
                <span className="text-muted-foreground">Building</span>
                <span>{listing.building.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b pb-2">
                <span className="text-muted-foreground">Area</span>
                <span>{listing.building.areaZone}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b pb-2">
                <span className="text-muted-foreground">Total floors</span>
                <span>{listing.building.totalFloors}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Photos</span>
                <span className="font-medium">{listing.building.images.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                {(() => {
                  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
                  const q = `${listing.building.lat},${listing.building.lng}`;
                  const src = apiKey
                    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${q}&zoom=16`
                    : `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
                  return (
                    <iframe
                      title="Apartment location"
                      src={src}
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  );
                })()}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {listing.building.addressLine ?? listing.building.areaZone}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>
              Sign in to view contact details and send inquiries.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="listing-signin-email">Email</Label>
              <Input
                id="listing-signin-email"
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="listing-signin-password">Password</Label>
              <Input
                id="listing-signin-password"
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                required
              />
            </div>
            {signInError && <p className="text-sm text-destructive">{signInError}</p>}
            <Button type="submit" disabled={signingIn} className="w-full">
              {signingIn ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No account?{" "}
              <Link href="/sign-up" className="underline">
                Create one
              </Link>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, searchApi, type ListingDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Phone, Mail, Building2 } from "lucide-react";
import { MdElevator, MdLocalParking, MdBolt, MdSecurity, MdVideocam, MdRoofing } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`;
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inquiryMsg, setInquiryMsg] = useState(
    "I am interested in this apartment. Please let me know about a visit.",
  );
  const [inquiryStatus, setInquiryStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [inquiryMsgText, setInquiryMsgText] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

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

  const apartmentImages = listing?.images ?? [];

  const isSale = listing?.listingType === "SALE";
  const priceMajor = listing ? ((isSale ? (listing.salePrice ?? 0) : listing.rentAmount) / 100) : 0;
  const serviceCharge = listing ? listing.serviceCharge / 100 : 0;
  const deposit = listing ? listing.securityDepositAmount / 100 : 0;
  const moveInTotal = isSale ? priceMajor : priceMajor + serviceCharge + deposit;

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;
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
          <Link href="/search" className="underline">Browse properties</Link>
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
                      onClick={() => setActiveImage((i) => (i - 1 + apartmentImages.length) % apartmentImages.length)}
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
                  <img src={img.url} alt={img.roomTag ?? `Property image ${idx + 1}`} className="w-full h-full object-cover" />
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
              <span className="text-3xl font-bold">৳{priceMajor.toLocaleString()}{isSale ? "" : "/mo"}</span>
              <p className="text-sm text-muted-foreground">
                + ৳{serviceCharge.toLocaleString()} service charge
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[["Bedrooms", listing.bedrooms], ["Bathrooms", listing.bathrooms], ["Verandas", listing.verandas], ["Floor", listing.floorNumber ?? "—"]].map(([label, value]) => (
              <div key={label} className="rounded p-3 bg-muted">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
                <div className="text-base font-semibold">{String(value)}</div>
              </div>
            ))}
          </div>

          <Separator />

          <h3 className="text-lg font-semibold mb-2">Cost breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isSale ? "Sale price" : "Monthly rent"}</span>
              <span className="font-medium">৳{priceMajor.toLocaleString()}{isSale ? "" : "/mo"}</span>
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
            <TabsContent value="details" className="mt-4 space-y-3">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {listing.bedrooms} bedroom(s) with {listing.bathrooms} bathroom(s) on floor {listing.floorNumber}.
                Available from {formatDate(listing.availableFrom)}.
              </div>
              <div className="border rounded p-3 bg-muted text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">{listing.building.areaZone} • {listing.building.totalFloors} floors</span>
                <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 mt-1"><span className="inline-flex items-center gap-1">{listing.building.hasElevator ? <><MdElevator className="h-3.5 w-3.5" /> Lift</> : "No lift"}</span><span className="inline-flex items-center gap-1">{listing.building.hasParking ? <><MdLocalParking className="h-3.5 w-3.5" /> Parking</> : "No parking"}</span><span className="inline-flex items-center gap-1">{listing.building.hasGenerator ? <><MdBolt className="h-3.5 w-3.5" /> Generator</> : "No generator"}</span></span>
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
              ].filter((a) => a.has).map((a) => (
                  <Badge key={a.label} variant="secondary" className="gap-1.5"><a.Icon className="h-3.5 w-3.5" />{a.label}</Badge>
                ))}
            </TabsContent>
            <TabsContent value="floorplan" className="mt-4">
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted text-muted-foreground">
                Floor plan image coming soon
              </div>
            </TabsContent>
          </Tabs>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Send inquiry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={submitInquiry}>
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Message</label>
                  <Textarea
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                {inquiryMsgText && (
                  <div className={`p-2 rounded text-sm ${inquiryStatus === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {inquiryMsgText}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={inquiryStatus === "sending"}
                  className="w-full"
                >
                  {inquiryStatus === "sending" ? "Sending…" : "Send inquiry"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Right: contact + building info */}
        <section className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  {user ? (contact?.phone ?? "Not listed") : (
                    <>
                      <span className="text-muted-foreground">Sign in to view phone</span>
                      <Link href="/sign-in" className="text-sm underline ml-2">Sign in</Link>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">{contact?.email ?? "Not listed"}</div>
              </div>
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
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border relative">
                <iframe
                  title="Apartment location"
                  src={`https://www.google.com/maps/embed/v1/place?key=&q=${listing.building.lat},${listing.building.lng}&zoom=16`}
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {listing.building.addressLine ?? listing.building.areaZone}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

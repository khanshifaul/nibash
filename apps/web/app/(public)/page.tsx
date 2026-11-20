"use client";

import { FiCheckCircle, FiMessageSquare, FiEye } from "react-icons/fi";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useEmblaCarousel from "embla-carousel-react";
import { Building2, MapPin, Bed, Bath, Maximize, ChevronLeft, ChevronRight, Grid3X3, List, Shield, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { searchApi, type ListingCard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MdElevator, MdLocalParking, MdBolt } from "react-icons/md";

gsap.registerPlugin(ScrollTrigger);

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=80",
];

function formatRent(n: number | null) {
  return n == null ? "—" : `৳${(n / 100).toLocaleString()}`;
}

function statusLabel(status: string) {
  if (status === "AVAILABLE") return "Available";
  if (status === "COMING_SOON") return "Coming soon";
  return status.replace(/_/g, " ");
}

function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    const autoplay = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(autoplay);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" });
      gsap.from(".hero-sub", { y: 20, opacity: 0, duration: 0.8, delay: 0.15, ease: "power3.out" });
      gsap.from(".hero-cta", { y: 16, opacity: 0, duration: 0.6, delay: 0.3, stagger: 0.1, ease: "power3.out" });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative h-[52vh] max-h-[560px] min-h-[380px] overflow-hidden">
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {HERO_IMAGES.map((src, i) => (
            <div key={i} className="relative flex-[0_0_100%] min-w-0 h-full">
              <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex items-center">
        <div className="max-w-2xl text-white">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-medium mb-4"
          >
            <Building2 className="h-3.5 w-3.5" />
            Verified buildings & apartments
          </motion.div>
          <h1 className="hero-title text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            Find your next home in <span className="text-blue-300">trusted buildings</span>
          </h1>
          <p className="hero-sub mt-4 text-sm sm:text-base lg:text-lg text-white/85 max-w-xl leading-relaxed">
            Explore verified apartments, compare amenities, view locations, and contact owners directly — all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search" className="hero-cta">
              <Button size="lg" className="text-base px-6 h-11 shadow-lg">
                Browse properties
              </Button>
            </Link>
            <Link href={user ? "/owner/buildings/new" : "/sign-in"} className="hero-cta">
              <Button size="lg" variant="outline" className="text-base px-6 h-11 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                List your property
              </Button>
            </Link>
          </div>
          <div className="hero-cta mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5"><FiCheckCircle className="h-4 w-4 text-blue-300" aria-hidden="true" /><strong className="text-white font-semibold">Verified</strong> buildings</span>
            <span className="inline-flex items-center gap-1.5"><FiMessageSquare className="h-4 w-4 text-blue-300" aria-hidden="true" /><strong className="text-white font-semibold">Direct</strong> owner inquiries</span>
            <span className="inline-flex items-center gap-1.5"><FiEye className="h-4 w-4 text-blue-300" aria-hidden="true" /><strong className="text-white font-semibold">Transparent</strong> details</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className="group flex items-center justify-center h-8 w-8"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span className={`block h-1.5 rounded-full transition-all ${i === selected ? "w-7 bg-white" : "w-1.5 bg-white/50 group-hover:bg-white/70"}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

function PropertyCard({ item }: { item: ListingCard }) {
  const image = item.images?.[0]?.url || item.building.coverImage?.url;
  return (
    <Link href={`/listings/${item.id}`} className="block h-full group">
      <Card className="relative overflow-hidden h-full rounded-xl border-border/70 hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer pb-10">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {image ? (
            <img src={image} alt={`${item.building.name} ${item.unitLabel}`} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-muted to-muted/70">
              <span className="text-4xl font-bold text-muted-foreground/25">{item.unitLabel}</span>
            </div>
          )}
          <Badge className="absolute top-3 left-3 shadow-sm backdrop-blur-sm" variant={item.availabilityStatus === "AVAILABLE" ? "default" : "secondary"}>
            {statusLabel(item.availabilityStatus)}
          </Badge>
        </div>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
            {item.building.name} · {item.unitLabel}
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{item.building.areaZone}{item.floorNumber != null ? ` · Floor ${item.floorNumber}` : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="pb-3 pt-0">
          <div className="text-lg font-bold tracking-tight">
            {formatRent(item.rentAmount)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
          </div>
          <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {item.bedrooms} bed</span>
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {item.bathrooms} bath</span>
            {item.sizeSqft ? <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {item.sizeSqft} sqft</span> : null}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="flex gap-1 flex-wrap pr-24">
            {item.building.hasElevator && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><MdElevator className="h-3 w-3" />Lift</span>}
            {item.building.hasParking && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><MdLocalParking className="h-3 w-3" />Parking</span>}
            {item.building.hasGenerator && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><MdBolt className="h-3 w-3" />Generator</span>}
          </div>
        </CardFooter>
        <span className="absolute bottom-0 right-0 inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-4 py-2.5 rounded-tl-xl shadow-sm">
          View details <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </Card>
    </Link>
  );
}

function PropertyListCard({ item }: { item: ListingCard }) {
  const image = item.images?.[0]?.url || item.building.coverImage?.url;
  return (
    <Link href={`/listings/${item.id}`} className="listing-card block group">
      <Card className="relative overflow-hidden rounded-xl border-border/70 hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer">
        <div className="flex flex-col sm:flex-row">
          <div className="relative sm:w-64 md:w-72 aspect-[16/10] sm:aspect-auto bg-muted shrink-0 overflow-hidden">
            {image ? (
              <img src={image} alt={`${item.building.name} ${item.unitLabel}`} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
            ) : (
              <div className="w-full h-full min-h-[170px] flex items-center justify-center bg-gradient-to-br from-primary/5 via-muted to-muted/70">
                <span className="text-4xl font-bold text-muted-foreground/25">{item.unitLabel}</span>
              </div>
            )}
            <Badge className="absolute top-3 left-3 shadow-sm" variant={item.availabilityStatus === "AVAILABLE" ? "default" : "secondary"}>
              {statusLabel(item.availabilityStatus)}
            </Badge>
          </div>
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors truncate">
                    {item.building.name} · {item.unitLabel}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.building.areaZone}{item.floorNumber != null ? ` · Floor ${item.floorNumber}` : ""}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold tracking-tight">{formatRent(item.rentAmount)}</div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Bed className="h-4 w-4" /> {item.bedrooms} bed</span>
                <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" /> {item.bathrooms} bath</span>
                {item.sizeSqft ? <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" /> {item.sizeSqft} sqft</span> : null}
                {item.verandas ? <span>{item.verandas} veranda</span> : null}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 gap-3 pb-8 sm:pb-0 pr-0 sm:pr-28">
              <div className="flex gap-1.5 flex-wrap">
                {item.building.hasElevator && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><MdElevator className="h-3.5 w-3.5" />Lift</span>}
                {item.building.hasParking && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><MdLocalParking className="h-3.5 w-3.5" />Parking</span>}
                {item.building.hasGenerator && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><MdBolt className="h-3.5 w-3.5" />Generator</span>}
              </div>
            </div>
            <span className="absolute bottom-0 right-0 inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-4 py-2.5 rounded-tl-xl shadow-sm">
              View details <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function FeaturedCarousel({ items, loading }: { items: ListingCard[]; loading: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => setSnaps(emblaApi.scrollSnapList()));
    onSelect();
  }, [emblaApi, items.length]);

  const featured = items.slice(0, 8);

  return (
    <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
      <div className="flex items-end justify-between mb-7 gap-4">
        <div>
          <p className="text-sm font-medium text-primary mb-1">Handpicked for you</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Featured properties</h2>
          <p className="text-muted-foreground mt-1">Popular apartments across trusted buildings</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="icon" onClick={() => emblaApi?.scrollPrev()} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => emblaApi?.scrollNext()} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : featured.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-10 text-center text-muted-foreground">
          No featured properties available yet.
        </div>
      ) : (
        <>
          <div className="overflow-hidden -mx-1 px-1" ref={emblaRef}>
            <div className="flex gap-4">
              {featured.map((item) => (
                <motion.div
                  key={item.id}
                  className="flex-[0_0_88%] sm:flex-[0_0_46%] lg:flex-[0_0_32%] min-w-0"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <PropertyCard item={item} />
                </motion.div>
              ))}
            </div>
          </div>
          {snaps.length > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              {snaps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className="group flex items-center justify-center h-8 w-8"
                  aria-label={`Go to slide ${i + 1}`}
                >
                  <span className={`block h-2 rounded-full transition-all ${i === selected ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 group-hover:bg-muted-foreground/50"}`} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PropertiesSection({ items, loading }: { items: ListingCard[]; loading: boolean }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.from(".listing-card", {
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
        y: 24,
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [view, loading, items.length]);

  return (
    <section ref={sectionRef} className="bg-muted/30 py-16 sm:py-20 border-y border-border/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-sm font-medium text-primary mb-1">Explore</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Available properties</h2>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading properties..." : `${items.length} ${items.length === 1 ? "property" : "properties"} to explore`}
            </p>
          </div>
          <div className="flex items-center gap-1 border rounded-lg p-1 bg-background w-fit">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-md transition-colors ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-md transition-colors ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className={view === "grid" ? "h-80 rounded-xl" : "h-44 rounded-xl"} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-background p-12 text-center">
            <h3 className="font-semibold text-lg">No properties available yet</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
              New properties will appear here once they are published. Check back soon or list your property to get started.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/search"><Button>Search properties</Button></Link>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {items.map((item) => (
                  <div key={item.id} className="listing-card">
                    <PropertyCard item={item} />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {items.map((item) => (
                  <PropertyListCard key={item.id} item={item} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="text-center mt-10">
          <Link href="/search"><Button size="lg" variant="outline" className="h-11 px-6">
            Browse all properties
          </Button></Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".feature-card", {
        scrollTrigger: { trigger: ref.current, start: "top 80%" },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  const features = [
    { icon: Shield, title: "Verified properties", desc: "Buildings and apartments go through moderation so you can trust what you see." },
    { icon: Zap, title: "Easy management", desc: "Owners can add buildings once and manage floors and apartments with ease." },
    { icon: MessageSquare, title: "Direct inquiries", desc: "Connect with owners directly and track inquiries from one dashboard." },
  ];

  return (
    <section ref={ref} className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
      <div className="text-center mb-10">
        <p className="text-sm font-medium text-primary mb-1">Why Nibash</p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Built for renters and property owners</h2>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">A simpler way to discover, compare, and manage rental properties.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <Card key={f.title} className="feature-card rounded-xl border-border/70 hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  const [items, setItems] = useState<ListingCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await searchApi.search({ limit: 12, sort: "newest" });
        if (!cancelled) setItems(data.items ?? []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <HeroSection />
      <FeaturedCarousel items={items} loading={loading} />
      <PropertiesSection items={items} loading={loading} />
      <FeaturesSection />
    </div>
  );
}

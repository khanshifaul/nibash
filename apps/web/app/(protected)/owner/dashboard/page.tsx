"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Building = {
  id: string;
  name: string;
  areaZone: string;
  totalFloors: number;
  moderationStatus: string;
  floors?: { id: string; floorNumber: number; apartments?: { id: string; availabilityStatus: string }[] }[];
};

export default function OwnerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await api.get<Building[]>("/buildings/mine");
        setBuildings(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load buildings");
      }
    })();
  }, [user]);

  if (loading || !user) return <div className="p-8">Loading...</div>;

  const totalBuildings = buildings.length;
  const totalUnits = buildings.reduce((sum, b) => sum + (b.floors?.reduce((s, f) => s + (f.apartments?.length ?? 0), 0) ?? 0), 0);
  const availableUnits = buildings.reduce((sum, b) => sum + (b.floors?.reduce((s, f) => s + (f.apartments?.filter(a => a.availabilityStatus === "AVAILABLE").length ?? 0), 0) ?? 0), 0);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Owner dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name || user.email}</p>
          {!user.isEmailVerified && (
            <p className="text-amber-700 text-sm mt-1">Email not verified. Verify to list properties and view contact info.</p>
          )}
        </div>
        <Link href="/owner/buildings/new" className="bg-black text-white px-4 py-2 rounded">Add building</Link>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border rounded p-4"><div className="text-sm text-gray-600">Buildings</div><div className="text-2xl font-bold">{totalBuildings}</div></div>
        <div className="border rounded p-4"><div className="text-sm text-gray-600">Total units</div><div className="text-2xl font-bold">{totalUnits}</div></div>
        <div className="border rounded p-4"><div className="text-sm text-gray-600">Available units</div><div className="text-2xl font-bold">{availableUnits}</div></div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">My buildings</h2>
        {buildings.length === 0 ? (
          <p className="text-gray-600">No buildings yet. <Link href="/owner/buildings/new" className="underline">Add your first building</Link>.</p>
        ) : (
          <div className="space-y-3">
            {buildings.map((b) => (
              <Link key={b.id} href={`/owner/buildings/${b.id}`} className="block border rounded p-4 hover:bg-gray-50">
                <div className="font-semibold">{b.name}</div>
                <div className="text-sm text-gray-600">{b.areaZone} • {b.totalFloors} floors • {b.moderationStatus}</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

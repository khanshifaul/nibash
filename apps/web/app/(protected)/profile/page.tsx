"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [loading, user, router]);

  async function load() {
    try {
      const data = await authApi.me();
      setProfile(data.data);
      setForm({ name: data.data.name ?? "", phone: data.data.phone ?? "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function update() {
    setSaving(true); setError(null);
    try {
      const data = await authApi.updateProfile({ name: form.name, phone: form.phone });
      setProfile(data.data);
      setForm({ name: data.data.name ?? "", phone: data.data.phone ?? "" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return <div className="p-8">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/owner/dashboard" className="text-sm underline">← Back to dashboard</Link>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium block">Email</label>
            <p className="text-sm">{profile?.email}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium block">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium block">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium block">Email verified</label>
            <p className={`text-sm ${profile?.isEmailVerified ? "text-green-700" : "text-amber-700"}`}>
              {profile?.isEmailVerified ? "Yes" : "No"}
            </p>
          </div>
          <button
            type="button"
            onClick={update}
            disabled={saving}
            className="w-full bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}

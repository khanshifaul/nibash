"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
      const me = await authApi.me();
      setProfile(me);
      setForm({ name: me.name ?? "", phone: me.phone ?? "" });
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
      const updated = await authApi.updateProfile({ name: form.name, phone: form.phone });
      setProfile(updated);
      setForm({ name: updated.name ?? "", phone: updated.phone ?? "" });
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
            <Label>Email</Label>
            <p className="text-sm">{profile?.email}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Email verified</Label>
            <p className={`text-sm ${profile?.isEmailVerified ? "text-green-700" : "text-amber-700"}`}>
              {profile?.isEmailVerified ? "Yes" : "No"}
            </p>
          </div>
          <Button
            type="button"
            onClick={update}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

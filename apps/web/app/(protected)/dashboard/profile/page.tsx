"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const me = await authApi.me();
        setProfile(me);
        setForm({ name: me.name ?? "", phone: me.phone ?? "" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      }
    })();
  }, [user]);

  async function update() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const updated = await authApi.updateProfile({ name: form.name || undefined, phone: form.phone || undefined });
      setProfile(updated);
      setForm({ name: updated.name ?? "", phone: updated.phone ?? "" });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return <div className="max-w-2xl mx-auto px-4 py-10">Loading…</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Back to dashboard</Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account details used for inquiries and property listings.</p>
      </div>

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}
      {saved && <p className="text-green-700 text-sm mb-4">Profile updated.</p>}

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Keep your name and phone number up to date so owners and renters can reach you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 bg-muted/30">
              <p className="text-sm">{profile?.email}</p>
              <Badge variant={profile?.isEmailVerified ? "default" : "secondary"}>
                {profile?.isEmailVerified ? "Verified" : "Not verified"}
              </Badge>
            </div>
            {!profile?.isEmailVerified && (
              <p className="text-xs text-amber-700">Verify your email to publish properties and access contact details.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+880..." />
          </div>
          <Button type="button" onClick={update} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { FiArrowLeft } from "react-icons/fi";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10 sm:py-14 bg-gradient-to-b from-background via-background to-muted/40">
      <div className="w-full max-w-[440px]">
        <Card className="shadow-xl shadow-black/5 border-border/70 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-3 px-6 sm:px-7 pt-7 sm:pt-8 text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Forgot password?</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-7 pb-6">
            {done ? (
              <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-5 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-green-900 dark:text-green-200 font-semibold">Check your email</p>
                  <p className="text-sm text-green-800/90 dark:text-green-300/90 mt-1">
                    If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                  </p>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                {error && (
                  <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email" required>Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-10 pl-9"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold rounded-lg">
                  {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>) : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="px-6 sm:px-7 pb-6 pt-0 flex flex-col">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mx-auto">
              <FiArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

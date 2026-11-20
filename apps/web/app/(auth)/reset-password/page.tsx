"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { FiArrowLeft } from "react-icons/fi";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/40">
        <Card className="w-full max-w-[440px] shadow-xl border-border/70 rounded-2xl">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <p className="text-destructive font-semibold">Invalid reset link</p>
            <p className="text-sm text-muted-foreground">
              This password reset link is missing or invalid.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block text-primary hover:underline text-sm font-medium"
            >
              Request a new reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10 sm:py-14 bg-gradient-to-b from-background via-background to-muted/40">
      <div className="w-full max-w-[440px]">
        <Card className="shadow-xl shadow-black/5 border-border/70 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-3 px-6 sm:px-7 pt-7 sm:pt-8 text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
              Set a new password
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-7 pb-6">
            {done ? (
              <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-5 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-green-900 dark:text-green-200 font-semibold">
                    Password reset successful
                  </p>
                  <p className="text-sm text-green-800/90 dark:text-green-300/90 mt-1">
                    Redirecting you to sign in…
                  </p>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit}>
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password" required>
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 pr-10"
                      minLength={8}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" required>
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 pr-10 ${passwordsMismatch ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      minLength={8}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="text-xs text-destructive">Passwords do not match.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-base font-semibold mt-2 rounded-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Resetting...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="px-6 sm:px-7 pb-6 pt-0 flex flex-col">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mx-auto"
            >
              <FiArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">Loading...</div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Phone, Lock, CheckCircle2, Circle, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (!pw) return { score: 0, label: "", color: "bg-muted" };
  if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 3) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 4) return { score: 3, label: "Good", color: "bg-blue-500" };
  return { score: 4, label: "Strong", color: "bg-green-500" };
}

export default function SignUpPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const requirements = useMemo(
    () => [
      { met: password.length >= 8, label: "At least 8 characters" },
      { met: /[A-Z]/.test(password) && /[a-z]/.test(password), label: "Upper & lowercase letters" },
      { met: /\d/.test(password), label: "At least one number" },
    ],
    [password],
  );

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    !loading;

  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
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
      await api.post("/auth/register", {
        name: name.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      await refresh();
      setSuccess("Account created successfully. Check your email to verify your account before listing properties or viewing contact details.");
      setTimeout(() => router.push("/owner/dashboard"), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-10 sm:py-14 bg-gradient-to-b from-background via-background to-muted/40">
      <div className="w-full max-w-[440px]">
        <Card className="shadow-xl shadow-black/5 border-border/70 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-3 px-6 sm:px-7 pt-7 sm:pt-8 text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">Create your account</CardTitle>
            <CardDescription className="text-sm sm:text-base">Join Nibash to discover homes or list your properties</CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-7 pb-6">
            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 p-5 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-green-900 dark:text-green-200 font-semibold">You&apos;re all set!</p>
                  <p className="text-sm text-green-800/90 dark:text-green-300/90 mt-1">{success}</p>
                </div>
                <p className="text-xs text-green-700/80 dark:text-green-400/80">Redirecting to your dashboard…</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                {error && (
                  <div role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive flex gap-2 items-start">
                    <span className="mt-0.5 shrink-0">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">Full name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahim Ahmed"
                    className="h-10"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" required className="text-sm font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched("email")}
                      placeholder="you@example.com"
                      className="h-10 pl-9"
                      required
                      autoComplete="email"
                      aria-invalid={touched.email && !email.trim() ? true : undefined}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1XXX-XXXXXX"
                      className="h-10 pl-9"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Helps owners contact you about inquiries.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" required className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => markTouched("password")}
                      placeholder="Create a password"
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 pr-10"
                      minLength={8}
                      required
                      autoComplete="new-password"
                      aria-describedby="password-hint"
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

                  {password.length > 0 && (
                    <div id="password-hint" className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-full flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-transparent"}`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-medium ${strength.score <= 1 ? "text-red-600" : strength.score === 2 ? "text-amber-600" : strength.score === 3 ? "text-blue-600" : "text-green-600"}`}>
                          {strength.label}
                        </span>
                      </div>
                      <ul className="grid grid-cols-1 gap-1">
                        {requirements.map((r) => (
                          <li key={r.label} className={`flex items-center gap-2 text-xs ${r.met ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                            {r.met ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {password.length === 0 && (
                    <p id="password-hint" className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" required className="text-sm font-medium">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => markTouched("confirmPassword")}
                      placeholder="Re-enter your password"
                      className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 pr-10 ${passwordsMismatch ? "border-destructive focus-visible:ring-destructive" : passwordsMatch ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                      minLength={8}
                      required
                      autoComplete="new-password"
                      aria-invalid={passwordsMismatch ? true : undefined}
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
                    <p className="text-xs text-destructive flex items-center gap-1">Passwords do not match.</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Passwords match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-11 text-base font-semibold mt-3 rounded-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-1">
                  By signing up, you agree to Nibash&apos;s terms of use and privacy practices.
                </p>
              </form>
            )}
          </CardContent>

          {!success && (
            <CardFooter className="px-6 sm:px-7 pb-6 pt-0 flex flex-col">
              <div className="w-full border-t pt-4 text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary font-semibold hover:underline">Sign in</Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

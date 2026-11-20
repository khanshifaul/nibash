"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const { refresh } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    (async () => {
      try {
        await api.post("/auth/verify-email", { token });
        await refresh();
        setStatus("success");
        setMessage(
          "Your email has been verified. You can now list properties and view contact info.",
        );
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      }
    })();
  }, [token, refresh]);

  return (
    <div className="max-w-md mx-auto py-10 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Verify email</h1>
      {status === "loading" && <p>Verifying...</p>}
      {status === "success" && <p className="text-green-700 mb-4">{message}</p>}
      {status === "error" && <p className="text-red-600 mb-4">{message}</p>}
      <Link href="/dashboard" className="underline">
        Go to dashboard
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-10 px-4 text-center">Loading...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}

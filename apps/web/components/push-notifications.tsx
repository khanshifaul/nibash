"use client";

import { useEffect, useState } from "react";
import { FiBell, FiBellOff } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushNotifications() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function subscribe() {
    setBusy(true);
    try {
      const { publicKey, enabled: serverEnabled } = await api.get<{
        publicKey: string;
        enabled: boolean;
      }>("/notifications/vapid-public-key");
      if (!serverEnabled || !publicKey) return;
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const json = sub.toJSON();
      await api.post("/notifications/subscribe", {
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      });
      setEnabled(true);
    } catch {
      // no-op: notifications are optional
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post("/notifications/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  if (!supported || permission === "denied") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        type="button"
        variant={enabled ? "secondary" : "default"}
        size="sm"
        className="shadow-lg gap-2"
        disabled={busy}
        onClick={() => void (enabled ? unsubscribe() : subscribe())}
      >
        {enabled ? (
          <FiBellOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <FiBell className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? "..." : enabled ? "Notifications on" : "Enable notifications"}
      </Button>
    </div>
  );
}

// Client-side helper to register the service worker and subscribe to push.
export const VAPID_PUBLIC_KEY = "BJuuyhng5PgEz_1XaeflNPad7aDpYGf4sCT0XDWBF8KNTubhV6IRJpYYgO72Lf7mTfjXcjGybwXMH7orp62Zebs";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(playerId: string): Promise<{ ok: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "المتصفح ده مش بيدعم الإشعارات." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "لازم توافق على الإشعارات من المتصفح." };
  }

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub = existing || (await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  }));

  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId,
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });

  if (!res.ok) return { ok: false, error: "تعذر حفظ الاشتراك." };
  return { ok: true };
}

// GET /portal-manifest?t=TOKEN: a web-app manifest so a patient can install their private page on the home screen.
// It only echoes the link the patient already has; it reads no data and needs no secrets.
const GOOD = /^[A-Za-z0-9_-]{8,128}$/;

export const manifestFor = (token) => ({
  name: "My dental visits",
  short_name: "My visits",
  description: "Your appointments, bills and advice from your dental clinic.",
  start_url: `/?portal=${encodeURIComponent(token)}`,
  scope: "/",
  display: "standalone",
  background_color: "#eaf1fc",
  theme_color: "#1e3a8a",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
});

export function onRequest({ request }) {
  const token = new URL(request.url).searchParams.get("t") || "";
  if (!GOOD.test(token)) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(manifestFor(token)), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" },
  });
}

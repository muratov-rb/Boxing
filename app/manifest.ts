import type { MetadataRoute } from "next";

/* The web app manifest — Next links it into every page automatically.

   This exists for the reminders. Notifications on iOS only work for a site
   the visitor has added to their home screen, and iOS only treats it as an
   app (rather than a Safari bookmark) when a manifest says `standalone`.
   Android uses the same file for its install prompt.

   start_url is the dashboard, not the marketing homepage: someone who has
   installed the app is a user, not a visitor. Signed out, the proxy sends
   /dashboard to /login, which is the right place for them anyway. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RingBornn — Train Like a Fighter",
    short_name: "RingBornn",
    description:
      "Web-first boxing training. AI-built plans, progress ranks, nutrition and technique.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0B0F",
    theme_color: "#0A0B0F",
    icons: [
      /* Padded to stay inside the circle Android may crop a maskable icon to,
         which is why the same file serves both purposes. */
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

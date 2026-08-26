import { ImageResponse } from "next/og";

/* The browser-tab icon.

   The project shipped with the Next.js starter's favicon.ico and never
   replaced it, so every tab, bookmark and history entry showed the framework's
   logo rather than the product's. That is the smallest possible branding gap
   and also one of the most visible — a tab icon is seen more often than the
   landing page.

   Drawn rather than shipped as a file so it cannot drift from the mark in
   components/ui/Logo.tsx: the same blood-red tile and the same double chevron.
   The strokes are heavier here than in the header, because a 32px icon loses
   any line thinner than about three pixels. */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/* One ">" built from two borders on a rotated square — Satori has no path
   support, so the chevron is geometry rather than an SVG stroke. */
function Chevron({ left }: { left: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 10,
        width: 11,
        height: 11,
        borderTop: "4px solid #fff",
        borderRight: "4px solid #fff",
        transform: "rotate(45deg)",
      }}
    />
  );
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#e30f2a",
          borderRadius: 7,
        }}
      >
        <Chevron left={4} />
        <Chevron left={13} />
      </div>
    ),
    size,
  );
}

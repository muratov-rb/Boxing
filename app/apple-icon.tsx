import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* The icon iOS uses when the site is added to the home screen.

   iOS will not take an SVG here, so this rasterises the same mark rather than
   keeping a second drawing that could drift from it — app/icon.svg is read at
   build time and embedded, so there is exactly one source for the artwork.

   The reminders feature asks iPhone users to install the site, because iOS web
   push only works from a home-screen install. Sending someone to do that and
   handing them a blank square would undercut the request.

   Solid background, no rounded corners: iOS applies its own mask, and a
   pre-rounded icon gets its corners cut twice. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const svg = readFileSync(join(process.cwd(), "app", "icon.svg"), "utf8");
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0B0F",
        }}
      >
        {/* Inset so the mark is not touching the edges once iOS rounds it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={150} height={150} alt="" />
      </div>
    ),
    size,
  );
}

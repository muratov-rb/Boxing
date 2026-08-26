import { ImageResponse } from "next/og";

/* The icon iOS uses when someone adds the site to their home screen.

   Worth having for its own sake, and worth having specifically because the
   reminders feature asks iPhone users to install the site — web push only
   works on iOS from a home-screen install. Sending them to do that and then
   handing them a blank grey square would undercut the whole ask.

   No rounded corners and no transparency: iOS applies its own mask, and a
   pre-rounded icon ends up with the corners cut twice. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

function Chevron({ left }: { left: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 56,
        width: 62,
        height: 62,
        borderTop: "20px solid #fff",
        borderRight: "20px solid #fff",
        transform: "rotate(45deg)",
      }}
    />
  );
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#e30f2a",
        }}
      >
        <Chevron left={22} />
        <Chevron left={72} />
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { SERVICE } from "@/lib/legal";

/* The card people see when the link is pasted into Telegram, WhatsApp,
   Instagram or a search result. Without one, a shared link renders as a blank
   grey box with a bare URL under it, which reads as broken rather than new.

   Drawn here rather than shipped as a file so it stays in step with the brand
   colours and never goes stale against a redesign. No webfont is loaded: the
   fetch would run on every cold render and a failed one produces a blank
   card, which is the exact failure this exists to prevent. */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SERVICE} — web-first boxing training`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0b0f",
          // the red corner, echoing the app's own brush background
          backgroundImage:
            "radial-gradient(70% 60% at 8% 0%, rgba(227,15,42,0.30), transparent 70%), radial-gradient(70% 60% at 95% 100%, rgba(47,107,255,0.22), transparent 70%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#99a0ac",
          }}
        >
          Web-first boxing training
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: -3,
            color: "#f3f4f7",
            lineHeight: 1,
          }}
        >
          {SERVICE}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 40,
            color: "#e30f2a",
            fontWeight: 700,
          }}
        >
          Train like a fighter. Look like an athlete.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            gap: 20,
            fontSize: 24,
            color: "#a3a8b4",
          }}
        >
          {["Start free", "No app", "No gear", "Beginner → Pro"].map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                border: "1px solid #2a2e39",
                borderRadius: 999,
                padding: "10px 22px",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

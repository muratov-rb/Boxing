"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

/* ===========================================================================
   TechniqueAnalyzer — record or upload a short clip → AI movement review.
   Privacy-first: an explicit consent screen shows BEFORE the camera is ever
   requested; uploading a file never touches the camera. We sample ~6 frames
   (a burst from the live camera, or evenly across an uploaded video) and send
   them to /api/technique-check with the chosen technique as the rubric.
   =========================================================================== */

export interface TechReview {
  score: number;
  verdict: string;
  summary: string;
  strengths: string[];
  fixes: string[];
  drills: string[];
}

type Stage =
  | "consent"
  | "camera"
  | "recording"
  | "preview"
  | "scanning"
  | "result"
  | "error";

const FRAME_COUNT = 6;
const FRAME_GAP_MS = 600;
const MAX_W = 480;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function drawScaled(
  src: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): string {
  const vw = src.videoWidth || 480;
  const vh = src.videoHeight || 360;
  const scale = Math.min(1, MAX_W / vw);
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  canvas.getContext("2d")?.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function TechniqueAnalyzer({
  techniqueId,
  techniqueName,
  onClose,
}: {
  techniqueId: string;
  techniqueName: string;
  onClose: () => void;
}) {
  const t = useTranslations("tech");
  const [stage, setStage] = useState<Stage>("consent");
  const [error, setError] = useState("");
  const [frames, setFrames] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<TechReview | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  useEffect(() => stopCamera, []);

  async function allowCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setStage("camera");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setError(t("cameraDenied"));
      setStage("error");
    }
  }

  async function record() {
    const video = videoRef.current;
    if (!video) return;
    setStage("recording");
    const canvas = document.createElement("canvas");
    const shots: string[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      setCountdown(FRAME_COUNT - i);
      shots.push(drawScaled(video, canvas));
      await sleep(FRAME_GAP_MS);
    }
    stopCamera();
    setFrames(shots);
    setStage("preview");
  }

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStage("scanning"); // show a spinner while we decode frames
    try {
      const shots = await framesFromVideo(file);
      if (shots.length === 0) throw new Error("no frames");
      setFrames(shots);
      setStage("preview");
    } catch {
      setError(t("videoFailed"));
      setStage("error");
    }
  }

  async function framesFromVideo(file: File): Promise<string[]> {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.src = url;
    v.muted = true;
    v.playsInline = true;
    await new Promise<void>((res, rej) => {
      v.onloadedmetadata = () => res();
      v.onerror = () => rej(new Error("load"));
    });
    const dur = isFinite(v.duration) && v.duration > 0 ? v.duration : 4;
    const canvas = document.createElement("canvas");
    const shots: string[] = [];
    const seek = (time: number) =>
      new Promise<void>((res) => {
        v.onseeked = () => res();
        v.currentTime = Math.min(time, Math.max(0, dur - 0.05));
      });
    for (let i = 0; i < FRAME_COUNT; i++) {
      await seek((dur * (i + 0.5)) / FRAME_COUNT);
      shots.push(drawScaled(v, canvas));
    }
    URL.revokeObjectURL(url);
    return shots;
  }

  async function analyze() {
    setStage("scanning");
    try {
      const res = await fetch("/api/technique-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ frames, techniqueId }),
      });
      if (res.status === 503) {
        setError(t("noAi"));
        setStage("error");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as TechReview;
      setResult(data);
      setStage("result");
    } catch {
      setError(t("analyzeFailed"));
      setStage("error");
    }
  }

  const scoreColor =
    result && result.score >= 75
      ? "text-azure"
      : result && result.score >= 45
        ? "text-blood"
        : "text-blood-bright";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="panel my-auto w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide">
            {t("title")} · <span className="text-blood">{techniqueName}</span>
          </h2>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="shrink-0 font-condensed text-xs uppercase tracking-widest text-ash hover:text-blood"
          >
            {t("close")}
          </button>
        </div>

        {/* consent — before any camera access */}
        {stage === "consent" && (
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="video" size={26} />
            </div>
            <p className="mt-4 text-center text-sm text-ash">{t("consentBody")}</p>
            <p className="mt-2 text-center text-xs text-ash-dim">{t("consentPrivacy")}</p>
            <div className="mt-6 grid gap-2">
              <button type="button" onClick={allowCamera} className="btn btn-primary w-full">
                {t("allowCamera")}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn btn-ghost w-full"
              >
                {t("uploadInstead")}
              </button>
            </div>
          </div>
        )}

        {/* live camera */}
        {(stage === "camera" || stage === "recording") && (
          <div>
            <div className="relative">
              <video
                ref={videoRef}
                playsInline
                muted
                className="aspect-[3/4] w-full rounded-lg border border-line/70 bg-black object-cover"
              />
              {stage === "recording" && (
                <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/40">
                  <span className="font-display text-6xl text-white">{countdown}</span>
                </div>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-ash-dim">{t("recordHint")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={record}
                disabled={stage === "recording"}
                className="btn btn-primary"
              >
                {stage === "recording" ? t("recording") : t("record")}
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setStage("consent");
                }}
                className="btn btn-ghost"
              >
                {t("back")}
              </button>
            </div>
          </div>
        )}

        {/* preview sampled frames */}
        {stage === "preview" && (
          <div>
            <div className="grid grid-cols-3 gap-1.5">
              {frames.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={f}
                  alt={`frame ${i + 1}`}
                  className="aspect-[3/4] w-full rounded-md border border-line/60 object-cover"
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={analyze} className="btn btn-primary">
                {t("analyze")}
              </button>
              <button
                type="button"
                onClick={() => setStage("consent")}
                className="btn btn-ghost"
              >
                {t("retake")}
              </button>
            </div>
          </div>
        )}

        {stage === "scanning" && (
          <div className="py-10 text-center">
            <div className="animate-glow mx-auto grid h-14 w-14 place-items-center rounded-full text-blood">
              <Icon name="bolt" size={28} />
            </div>
            <p className="mt-4 font-condensed text-sm uppercase tracking-[0.25em] text-ash">
              {t("analyzing")}
            </p>
          </div>
        )}

        {/* result */}
        {stage === "result" && result && (
          <div className="animate-rise">
            <div className="flex items-center justify-between border-b border-line/70 pb-4">
              <div>
                <p className="font-condensed text-xs uppercase tracking-widest text-ash-dim">
                  {t("score")}
                </p>
                <p className={`font-display text-5xl leading-none ${scoreColor}`}>
                  {result.score}
                  <span className="text-xl text-ash-dim">/100</span>
                </p>
              </div>
              <p className="max-w-[55%] text-right font-condensed text-sm uppercase tracking-wide text-bone">
                {result.verdict}
              </p>
            </div>

            {result.summary && (
              <p className="mt-4 text-sm text-ash">{result.summary}</p>
            )}

            {result.strengths.length > 0 && (
              <Section label={t("strengths")} color="text-azure" items={result.strengths} icon="check" />
            )}
            {result.fixes.length > 0 && (
              <Section label={t("fixes")} color="text-blood" items={result.fixes} icon="target" />
            )}
            {result.drills.length > 0 && (
              <Section label={t("drills")} color="text-bone" items={result.drills} icon="bolt" />
            )}

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStage("consent")}
                className="btn btn-ghost"
              >
                {t("again")}
              </button>
              <button type="button" onClick={onClose} className="btn btn-primary">
                {t("done")}
              </button>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="py-6 text-center">
            <p className="text-sm text-blood-bright">{error}</p>
            <button
              type="button"
              onClick={() => setStage("consent")}
              className="btn btn-ghost mt-5"
            >
              {t("back")}
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          onChange={pickFile}
          className="hidden"
        />
      </div>
    </div>
  );
}

function Section({
  label,
  color,
  items,
  icon,
}: {
  label: string;
  color: string;
  items: string[];
  icon: "check" | "target" | "bolt";
}) {
  return (
    <div className="mt-4">
      <h3 className={`font-condensed text-xs font-bold uppercase tracking-widest ${color}`}>
        {label}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-bone/90">
            <span className={`mt-0.5 ${color}`}>
              <Icon name={icon} size={14} />
            </span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

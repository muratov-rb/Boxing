"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icons";

/* ===========================================================================
   FoodScanner — photo → Claude vision → calories.
   Privacy-first: an explicit consent screen is shown BEFORE the camera is
   ever requested; uploading a file never touches the camera at all.
   =========================================================================== */

interface ScanItem {
  name: string;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}
export interface ScanResult {
  items: ScanItem[];
  total_kcal: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  note: string;
}

export interface ScanMacros {
  protein?: number;
  carbs?: number;
  fat?: number;
}

type Stage = "consent" | "camera" | "preview" | "scanning" | "result" | "error";

export function FoodScanner({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, kcal: number, macros: ScanMacros) => void;
  onClose: () => void;
}) {
  const t = useTranslations("scan");
  const [stage, setStage] = useState<Stage>("consent");
  const [error, setError] = useState<string>("");
  const [photo, setPhoto] = useState<string>(""); // dataURL
  const [result, setResult] = useState<ScanResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  useEffect(() => stopCamera, []);

  /* -- consent accepted → NOW we may ask the browser for the camera -- */
  async function allowCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setStage("camera");
      // attach after render
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

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 540;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setStage("preview");
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      setStage("preview");
    };
    reader.readAsDataURL(f);
  }

  async function scan() {
    setStage("scanning");
    try {
      const res = await fetch("/api/food-scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: photo }),
      });
      if (res.status === 503) {
        setError(t("noAi"));
        setStage("error");
        return;
      }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as ScanResult;
      setResult(data);
      setStage("result");
    } catch {
      setError(t("scanFailed"));
      setStage("error");
    }
  }

  function addAll() {
    if (!result) return;
    if (result.items.length === 0) return onClose();
    const name = result.items.map((i) => i.name).join(", ");
    onAdd(name, result.total_kcal, {
      protein: result.total_protein,
      carbs: result.total_carbs,
      fat: result.total_fat,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="panel w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-condensed text-lg font-bold uppercase tracking-wide">
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="font-condensed text-xs uppercase tracking-widest text-ash hover:text-blood"
          >
            {t("close")}
          </button>
        </div>

        {/* -------- consent: shown BEFORE any camera access -------- */}
        {stage === "consent" && (
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-blood/40 text-blood">
              <Icon name="calorie" size={26} />
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

        {/* -------- live camera -------- */}
        {stage === "camera" && (
          <div>
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[4/3] w-full rounded-lg border border-line/70 bg-black object-cover"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={capture} className="btn btn-primary">
                {t("capture")}
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

        {/* -------- preview + scan -------- */}
        {stage === "preview" && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt="Meal preview"
              className="aspect-[4/3] w-full rounded-lg border border-line/70 object-cover"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={scan} className="btn btn-primary">
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
              {t("scanning")}
            </p>
          </div>
        )}

        {/* -------- result -------- */}
        {stage === "result" && result && (
          <div>
            <ul className="divide-y divide-line/70">
              {result.items.length === 0 && (
                <li className="py-3 text-sm text-ash">{t("nothingFound")}</li>
              )}
              {result.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-bone/90">{it.name}</span>
                  <span className="font-condensed text-ash">{it.kcal} kcal</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
              <span className="font-condensed text-sm font-bold uppercase tracking-wide">
                {t("total")}
              </span>
              <span className="font-display text-2xl">{result.total_kcal} kcal</span>
            </div>
            {/* macro breakdown */}
            {result.items.length > 0 &&
              (result.total_protein != null ||
                result.total_carbs != null ||
                result.total_fat != null) && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: t("protein"), value: result.total_protein },
                    { label: t("carbs"), value: result.total_carbs },
                    { label: t("fat"), value: result.total_fat },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl border border-line/70 bg-void/40 py-2 text-center"
                    >
                      <p className="font-display text-xl leading-none">
                        {m.value ?? 0}
                        <span className="text-xs text-ash-dim">g</span>
                      </p>
                      <p className="mt-1 font-condensed text-[0.6rem] uppercase tracking-widest text-ash-dim">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            {result.note && <p className="mt-3 text-xs text-ash-dim">{result.note}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={addAll}
                disabled={result.items.length === 0}
                className="btn btn-primary"
              >
                {t("addMeal")}
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
          accept="image/*"
          onChange={pickFile}
          className="hidden"
        />
      </div>
    </div>
  );
}

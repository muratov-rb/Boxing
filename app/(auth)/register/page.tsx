import type { Metadata } from "next";
import { safeNext } from "@/lib/safe-next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = { title: "Create Account — RingBornn" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  return <AuthCard mode="register" next={next} hadError={!!sp.error} />;
}

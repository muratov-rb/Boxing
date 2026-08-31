import type { Metadata } from "next";
import { safeNext } from "@/lib/safe-next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = { title: "Log In — RingBornn" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  return (
    <AuthCard
      mode="login"
      next={next}
      hadError={!!sp.error}
      banned={sp.banned === "1"}
    />
  );
}

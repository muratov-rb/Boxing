import type { Metadata } from "next";
import { FriendsClient } from "@/components/friends/FriendsClient";
import { SERVICE } from "@/lib/legal";

export const metadata: Metadata = {
  title: `Training Partners — ${SERVICE}`,
  description:
    "Add a training partner, watch each other's streak, and send challenges. Training alone is the easiest way to stop.",
};

/* Signed-in only. The gate is the PROTECTED list in the proxy, not this file --
   see the note there. */
export default function FriendsPage() {
  return <FriendsClient />;
}

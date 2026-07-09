import type { Metadata } from "next";
import { TrainClient } from "@/components/train/TrainClient";

export const metadata: Metadata = { title: "Today's Workout — RingBornn" };

export default function TrainPage() {
  return <TrainClient />;
}

"use client";

import { useEffect, useState } from "react";
import { KEYS, loadProfile, mealsToday, onTrackingChange, type Meal } from "@/lib/tracking";
import type { Profile } from "@/lib/onboarding";

/* Today's meals, kept current across every panel on the page.

   The alternative was lifting meal state into the page and threading setters
   down through four components. tracking.ts already announces its own writes
   for the Supabase sync layer, so subscribing here means a meal logged in the
   counter updates the rings and the mineral bars without any of them knowing
   the others exist. */

export interface TodayNutrition {
  meals: Meal[];
  profile: Profile | null;
  /** False until the first client render — localStorage cannot be read during
      SSR, and rendering a zero total before hydration causes a visible flip. */
  ready: boolean;
}

export function useTodayNutrition(): TodayNutrition {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMeals(mealsToday());
    setProfile(loadProfile());
    setReady(true);

    return onTrackingChange((key) => {
      if (key === KEYS.meals) setMeals(mealsToday());
      else if (key === KEYS.profile) setProfile(loadProfile());
    });
  }, []);

  return { meals, profile, ready };
}

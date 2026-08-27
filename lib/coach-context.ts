import "server-only";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";
import { calorieTarget, macroTargets } from "./tracking";
import type { Profile } from "./onboarding";

/* What the coach is allowed to know when answering a question.

   Read on the server from the stored profile rather than accepted from the
   request, so nobody can claim to be a 120 kg professional to get different
   advice. Deliberately narrow: enough for "how much protein should I eat" to
   come back in grams, and nothing that would make an answer feel like the app
   is reciting a file back at them.

   Absent for anyone who has not finished onboarding, and the coach is told to
   answer generally in that case rather than guess. */

export async function loadProfileForPrompt(userId: string): Promise<string | null> {
  if (!serviceRoleConfigured()) return null;

  try {
    const { data } = await createAdminClient()
      .from("user_profiles")
      .select("profile")
      .eq("user_id", userId)
      .maybeSingle<{ profile: Profile | null }>();

    const p = data?.profile;
    if (!p?.path) return null;

    const macros = macroTargets(p);
    const lines = [
      `Experience: ${p.path === "experienced" ? "already boxes" : "beginner"}`,
      p.weight ? `Weight: ${p.weight} ${p.weightUnit}` : null,
      p.age ? `Age: ${p.age}` : null,
      p.sex ? `Sex: ${p.sex}` : null,
      p.goals?.length ? `Goals: ${p.goals.join(", ")}` : null,
      `Daily target: ~${calorieTarget(p)} kcal, ~${macros.protein} g protein`,
      p.environment ? `Trains: ${p.environment}` : null,
      p.equipment?.length ? `Equipment: ${p.equipment.join(", ")}` : null,
      p.customEquipment?.length ? `Also owns: ${p.customEquipment.join(", ")}` : null,
    ].filter(Boolean);

    return lines.join("\n");
  } catch {
    return null; // context is a nicety; never fail the question over it
  }
}

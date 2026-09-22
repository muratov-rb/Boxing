import "server-only";
import { createAdminClient, serviceRoleConfigured } from "./supabase/admin";
import type { ScanResultOut } from "./scan-result";
import { decide, recordFromLabel, type ProductRecord } from "./product-record";

/* ===========================================================================
   Products learned from nutrition labels: the database part.

   The rules live in lib/product-record.ts; this only reads and writes the
   `products` table (db/migrations/009_products.sql), which the browser cannot
   reach -- every call here uses the service role.

   Both functions fail soft. A product store that is down must never stop a
   scan: a lookup miss falls through to Open Food Facts, and a failed save
   just means the next person reads the label too.
   =========================================================================== */

const COLUMNS = "barcode, name, grams, kcal, protein, carbs, fat, fiber, micros, confirmations";

/** The first of these barcodes the app has learned, or null. */
export async function findProduct(codes: string[]): Promise<ProductRecord | null> {
  if (!serviceRoleConfigured() || codes.length === 0) return null;
  try {
    const { data, error } = await createAdminClient()
      .from("products")
      .select(COLUMNS)
      .in("barcode", codes)
      .returns<ProductRecord[]>();
    if (error || !data || data.length === 0) return null;
    /* Several forms of one code can only match one product, but if they ever
       both exist, prefer the form that was scanned. */
    for (const code of codes) {
      const hit = data.find((row) => row.barcode === code);
      if (hit) return hit;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Keep a label read against the barcode that sent the person to the label.
 * Returns whether the store now holds (or has just confirmed) this read.
 */
export async function rememberLabel(
  barcode: string,
  result: Pick<ScanResultOut, "items" | "micros">,
  userId: string,
): Promise<boolean> {
  if (!serviceRoleConfigured()) return false;
  const record = recordFromLabel(barcode, result);
  if (!record) return false;
  try {
    const supabase = createAdminClient();
    const { data: existing, error: readError } = await supabase
      .from("products")
      .select("kcal, confirmations")
      .eq("barcode", barcode)
      .maybeSingle<Pick<ProductRecord, "kcal" | "confirmations">>();
    if (readError) return false;

    const now = new Date().toISOString();
    switch (decide(existing ? { ...existing, kcal: Number(existing.kcal) } : null, record)) {
      case "insert": {
        const { error } = await supabase
          .from("products")
          .insert({ ...record, created_by: userId, confirmations: 1 });
        return !error;
      }
      case "confirm": {
        const { error } = await supabase
          .from("products")
          .update({ confirmations: existing!.confirmations + 1, updated_at: now })
          .eq("barcode", barcode);
        return !error;
      }
      case "replace": {
        const { error } = await supabase
          .from("products")
          .update({ ...record, created_by: userId, confirmations: 1, updated_at: now })
          .eq("barcode", barcode);
        return !error;
      }
      case "keep":
        return false;
    }
  } catch {
    return false;
  }
}

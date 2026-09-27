/* ===========================================================================
   Reading a JSON request body with a size ceiling.

   The AI routes paste parts of the body -- free-text notes, custom equipment
   -- straight into the prompt, and a request of any size was accepted. A few
   megabytes of "diet notes" became hundreds of thousands of input tokens per
   call: dollars instead of fractions of a cent, repeatable up to the daily
   allowance on every account (found in the 2026-09-27 audit). A real profile
   is 1-3 KB, so a small ceiling costs a genuine user nothing.
   =========================================================================== */

export type JsonRead<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 413; error: "bad_request" | "too_large" };

export async function readJsonCapped<T>(req: Request, maxBytes: number): Promise<JsonRead<T>> {
  /* A declared length over the ceiling is refused before anything is read. */
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: "too_large" };
  }
  let text: string;
  try {
    text = await req.text();
  } catch {
    return { ok: false, status: 400, error: "bad_request" };
  }
  /* The header can be absent or wrong (chunked uploads), so measure what
     actually arrived as well. */
  if (new TextEncoder().encode(text).length > maxBytes) {
    return { ok: false, status: 413, error: "too_large" };
  }
  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 400, error: "bad_request" };
  }
}

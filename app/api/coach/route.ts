import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { guardAiRoute, isDenied } from "@/lib/api-guard";
import { loadProfileForPrompt } from "@/lib/coach-context";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

/* Ask the coach a question.

   Text in, text out, which makes it roughly a tenth the cost of a photo scan
   and the cheapest thing here to run — and the closest the app gets to what
   people actually want from a corner, which is to ask something and be
   answered rather than to be handed a plan.

   The answer is deliberately short. A wall of text is what a search engine
   gives you; a coach gives you the answer and moves on. */

const MAX_Q = 400;

const SYSTEM = `You are the coach at RingBornn, a boxing training app. Someone
has asked you a question. Answer it the way a good trainer answers between
rounds: direct, specific, and finished in a few sentences.

Rules:
- Get to the answer in the first sentence. No preamble, no restating the question.
- 120 words maximum. Usually far less. If it can be answered in one line, use one line.
- Be concrete. "Exhale sharply as the punch lands" beats "focus on your breathing".
- If the honest answer is "that depends", say what it depends on in one line, then
  give your best answer for the most likely case.
- Never invent facts about their body, their training history or their results.

Safety, and these override brevity:
- Anything involving a head knock, being dropped, dizziness, confusion or memory
  trouble: tell them to stop training and see a doctor before sparring again.
  Do not coach through it.
- Sharp pain, joint pain lasting past the next morning, or any injury that is not
  ordinary soreness: send them to a medical professional.
- Do not give medical diagnoses, prescribe supplements or dosages, or advise
  aggressive weight cutting. Say plainly that those need a qualified person.
- If someone describes disordered eating, be kind and point them at professional
  help rather than giving them numbers.

You are a coach, not a doctor, and you never pretend otherwise.`;

export async function POST(req: Request) {
  /* Quota first, so a signed-out or out-of-allowance caller costs nothing. */
  const guard = await guardAiRoute("coachAsk");
  if (isDenied(guard)) return guard.response;

  let body: { question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const question = (body.question ?? "").trim().slice(0, MAX_Q);
  if (question.length < 3) {
    return NextResponse.json({ error: "empty_question" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no_ai" }, { status: 503 });

  const store = await cookies();
  const locale = store.get("locale")?.value === "ru" ? "ru" : "en";

  /* Their own numbers, so "how much protein should I eat" gets an answer in
     grams rather than a formula. Absent for anyone who has not onboarded. */
  const context = await loadProfileForPrompt(guard.userId);

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system:
        SYSTEM +
        (context ? `\n\nWhat you know about them:\n${context}` : "") +
        (locale === "ru" ? "\n\nAnswer in Russian." : ""),
      messages: [{ role: "user", content: question }],
    });

    const block = message.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("no output");

    return NextResponse.json({ answer: block.text.trim() });
  } catch {
    return NextResponse.json({ error: "ask_failed" }, { status: 502 });
  }
}

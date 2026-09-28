import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureSchema } from "@/lib/db";
import { BOOTHS, CRITERIA } from "@/lib/data";

export const dynamic = "force-dynamic";

const CRITERION_KEYS = new Set(CRITERIA.map((c) => c.key));

export async function POST(req: NextRequest) {
  await ensureSchema();
  const sql = getSql();

  const body = await req.json();
  const evaluatorName = String(body.evaluatorName || "").trim();
  const booth = String(body.booth || "").trim();
  const scores = body.scores as Record<string, number>;

  if (!evaluatorName) {
    return NextResponse.json({ error: "Evaluator name is required" }, { status: 400 });
  }
  if (!BOOTHS.includes(booth)) {
    return NextResponse.json({ error: "Invalid booth" }, { status: 400 });
  }
  if (!scores || typeof scores !== "object") {
    return NextResponse.json({ error: "Scores are required" }, { status: 400 });
  }

  for (const [criterion, score] of Object.entries(scores)) {
    if (!CRITERION_KEYS.has(criterion as never)) {
      return NextResponse.json({ error: `Invalid criterion: ${criterion}` }, { status: 400 });
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: `Invalid score for ${criterion}` }, { status: 400 });
    }
  }

  for (const [criterion, score] of Object.entries(scores)) {
    await sql`
      INSERT INTO scores (evaluator_name, booth, criterion, score)
      VALUES (${evaluatorName}, ${booth}, ${criterion}, ${score})
      ON CONFLICT (evaluator_name, booth, criterion)
      DO UPDATE SET score = EXCLUDED.score, created_at = now()
    `;
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  await ensureSchema();
  const sql = getSql();

  const rows = await sql`
    SELECT booth, criterion, score, evaluator_name FROM scores
  `;

  return NextResponse.json({ rows });
}

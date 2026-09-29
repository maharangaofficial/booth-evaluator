import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureSchema } from "@/lib/db";
import { BOOTHS, CRITERIA } from "@/lib/data";

export const dynamic = "force-dynamic";

const CRITERION_KEYS = new Set(CRITERIA.map((c) => c.key));
const BOOTH_CODES = new Set(BOOTHS.map((b) => b.code));

export async function POST(req: NextRequest) {
  await ensureSchema();
  const sql = getSql();

  const body = await req.json();
  const evaluatorName = String(body.evaluatorName || "").trim();
  const booth = String(body.booth || "").trim();
  const scores = body.scores as Record<string, number>;
  const comment = String(body.comment || "").trim();

  if (!evaluatorName) {
    return NextResponse.json({ error: "Evaluator name is required" }, { status: 400 });
  }
  if (!BOOTH_CODES.has(booth)) {
    return NextResponse.json({ error: "Invalid booth" }, { status: 400 });
  }
  if (!scores || typeof scores !== "object") {
    return NextResponse.json({ error: "Scores are required" }, { status: 400 });
  }
  if (!comment) {
    return NextResponse.json({ error: "A remark is required" }, { status: 400 });
  }

  for (const criterion of CRITERION_KEYS) {
    if (!(criterion in scores)) {
      return NextResponse.json({ error: `Missing score for ${criterion}` }, { status: 400 });
    }
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

  await sql`
    INSERT INTO comments (evaluator_name, booth, comment)
    VALUES (${evaluatorName}, ${booth}, ${comment})
    ON CONFLICT (evaluator_name, booth)
    DO UPDATE SET comment = EXCLUDED.comment, created_at = now()
  `;

  return NextResponse.json({ ok: true });
}

export async function GET() {
  await ensureSchema();
  const sql = getSql();

  const [rows, comments] = await Promise.all([
    sql`SELECT booth, criterion, score, evaluator_name FROM scores`,
    sql`SELECT booth, evaluator_name, comment FROM comments`,
  ]);

  return NextResponse.json({ rows, comments });
}

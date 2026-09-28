import { NextRequest, NextResponse } from "next/server";
import { getSql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Admin password is not configured on the server" },
      { status: 500 }
    );
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await ensureSchema();
  const sql = getSql();

  const rows = await sql`
    SELECT booth, criterion, score, evaluator_name, created_at
    FROM scores
    ORDER BY booth, evaluator_name, criterion
  `;

  return NextResponse.json({ rows });
}

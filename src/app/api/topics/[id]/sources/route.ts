import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSourceSchema } from "@/lib/validations/topic";
import { getTopicSources, addSource, deleteSource } from "@/lib/db/queries";

// GET /api/topics/[id]/sources — list sources for a topic
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sources = await getTopicSources(id);
  return NextResponse.json(sources);
}

// POST /api/topics/[id]/sources — add a source to a topic
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = createSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const source = await addSource(id, parsed.data);
  return NextResponse.json(source, { status: 201 });
}
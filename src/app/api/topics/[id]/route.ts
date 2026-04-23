import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { updateTopicSchema } from "@/lib/validations/topic";
import { getTopicById, updateTopic, deleteTopic } from "@/lib/db/queries";

// GET /api/topics/[id] — get a single topic
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const topic = await getTopicById(session.user.id, id);
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(topic);
}

// PATCH /api/topics/[id] — update a topic
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTopicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await updateTopic(session.user.id, id, parsed.data);
  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(topic);
}

// DELETE /api/topics/[id] — delete a topic
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteTopic(session.user.id, id);
  return NextResponse.json({ ok: true });
}
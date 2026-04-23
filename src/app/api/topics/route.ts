import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { topics } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createTopicSchema, updateTopicSchema } from "@/lib/validations/topic";
import { createTopic, getUserTopics, getTopicById, updateTopic, deleteTopic } from "@/lib/db/queries";

// GET /api/topics — list current user's topics
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getUserTopics(session.user.id);
  return NextResponse.json(result);
}

// POST /api/topics — create a topic
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTopicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const topic = await createTopic(session.user.id, parsed.data);
  return NextResponse.json(topic, { status: 201 });
}
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getTopicById } from "@/lib/db/queries";
import { addSource, getTopicSources } from "@/lib/db/queries";
import { suggestSourcesForTopic } from "@/lib/ai/sources";

// POST /api/topics/[id]/suggest-sources — AI suggests sources for a topic
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const topic = await getTopicById(session.user.id, id);
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  try {
    const suggested = await suggestSourcesForTopic({
      topic: topic.title,
      description: topic.description ?? undefined,
      language: topic.language,
    });

    const existingSources = await getTopicSources(topic.id);
    const existingUrls = new Set(existingSources.map((s) => s.url));

    const added = [];
    for (const source of suggested.sources) {
      if (!existingUrls.has(source.url)) {
        const created = await addSource(topic.id, {
          type: source.type,
          url: source.url,
          label: source.label,
          isAuto: true,
        });
        added.push(created);
      }
    }

    return NextResponse.json({ sources: added });
  } catch (error) {
    console.error("Failed to suggest sources:", error);
    return NextResponse.json(
      { error: "Failed to suggest sources" },
      { status: 500 }
    );
  }
}
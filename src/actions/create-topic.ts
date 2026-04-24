"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createTopic, addSource } from "@/lib/db/queries";
import { createTopicSchema } from "@/lib/validations/topic";
import { suggestSourcesForTopic } from "@/lib/ai/sources";

export async function createTopicWithSources(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = createTopicSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    frequency: formData.get("frequency"),
    formatPref: formData.get("formatPref"),
    language: formData.get("language"),
  });

  if (!parsed.success) {
    throw new Error("Invalid topic data: " + JSON.stringify(parsed.error.flatten()));
  }

  const topic = await createTopic(session.user.id, parsed.data);

  // Auto-suggest sources via AI
  try {
    const suggested = await suggestSourcesForTopic({
      topic: parsed.data.title,
      description: parsed.data.description,
      language: parsed.data.language,
    });

    for (const source of suggested.sources) {
      await addSource(topic.id, {
        type: source.type,
        url: source.url,
        label: source.label,
        isAuto: true,
      });
    }
  } catch (error) {
    // If AI suggestion fails, the topic is still created — just no auto sources
    console.error("Failed to auto-suggest sources:", error);
  }

  redirect(`/dashboard/topics/${topic.id}`);
}
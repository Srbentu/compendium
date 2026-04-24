"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createTopic } from "@/lib/db/queries";
import { createTopicSchema } from "@/lib/validations/topic";

export async function createTopicAction(formData: FormData) {
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
  redirect(`/dashboard/topics/${topic.id}`);
}
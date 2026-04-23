import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTopicById, deleteTopic, updateTopic } from "@/lib/db/queries";
import { getTopicSources, addSource, deleteSource } from "@/lib/db/queries";
import { createSourceSchema } from "@/lib/validations/topic";
import Link from "next/link";
import { revalidatePath } from "next/cache";

interface TopicDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TopicDetailPage({ params }: TopicDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const topic = await getTopicById(session.user.id, id);
  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Topic not found</h2>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const topicSources = await getTopicSources(topic.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center gap-4 px-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">{topic.title}</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-8 space-y-8">
        {/* Topic info */}
        <section className="rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{topic.title}</h2>
              {topic.description && (
                <p className="mt-1 text-muted-foreground">{topic.description}</p>
              )}
              <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{topic.frequency === "daily" ? "📅 Daily" : "📅 Weekly"}</span>
                <span>
                  {topic.formatPref === "text"
                    ? "📝 Text"
                    : topic.formatPref === "audio"
                      ? "🎧 Audio"
                      : "📝🎧 Both"}
                </span>
                <span>{topic.language === "pt" ? "🇧🇷 PT" : topic.language === "de" ? "🇩🇪 DE" : "🇺🇸 EN"}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${topic.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {topic.active ? "Active" : "Paused"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <form
              action={async () => {
                "use server";
                await updateTopic(session.user.id, id, { active: !topic.active });
                revalidatePath(`/dashboard/topics/${id}`);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-input px-3 py-1.5 text-sm shadow-sm hover:bg-accent transition-colors"
              >
                {topic.active ? "⏸ Pause" : "▶ Resume"}
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteTopic(session.user.id, id);
                redirect("/dashboard");
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 shadow-sm hover:bg-red-50 transition-colors"
              >
                🗑 Delete
              </button>
            </form>
          </div>
        </section>

        {/* Sources */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Sources</h3>

          {topicSources.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">No sources yet. Add an RSS feed, NewsAPI query, or Reddit subreddit below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topicSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono uppercase">
                      {source.type}
                    </span>
                    <span className="text-sm truncate max-w-md">{source.url}</span>
                    {source.label && (
                      <span className="text-xs text-muted-foreground">({source.label})</span>
                    )}
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteSource(topic.id, source.id);
                      revalidatePath(`/dashboard/topics/${id}`);
                    }}
                  >
                    <button
                      type="submit"
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Add source form */}
          <form
            action={async (formData: FormData) => {
              "use server";
              const type = formData.get("sourceType") as string;
              const url = formData.get("sourceUrl") as string;
              const label = formData.get("sourceLabel") as string;

              const parsed = createSourceSchema.safeParse({
                type,
                url,
                label: label || undefined,
              });

              if (parsed.success) {
                await addSource(topic.id, parsed.data);
                revalidatePath(`/dashboard/topics/${id}`);
              }
            }}
            className="mt-4 flex items-end gap-3"
          >
            <div>
              <label htmlFor="sourceType" className="block text-xs font-medium mb-1">
                Type
              </label>
              <select
                id="sourceType"
                name="sourceType"
                defaultValue="rss"
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="rss">RSS</option>
                <option value="newsapi">NewsAPI</option>
                <option value="reddit">Reddit</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="sourceUrl" className="block text-xs font-medium mb-1">
                URL
              </label>
              <input
                id="sourceUrl"
                name="sourceUrl"
                type="url"
                required
                placeholder="https://example.com/feed.xml"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="sourceLabel" className="block text-xs font-medium mb-1">
                Label
              </label>
              <input
                id="sourceLabel"
                name="sourceLabel"
                type="text"
                placeholder="Optional"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
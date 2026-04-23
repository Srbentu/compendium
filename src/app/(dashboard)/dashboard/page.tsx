import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserTopics } from "@/lib/db/queries";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userTopics = await getUserTopics(session.user.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" className="text-xl font-bold">
            Compendium
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Topics</h2>
            <p className="mt-1 text-muted-foreground">
              Choose the subjects you care about and get AI-curated digests.
            </p>
          </div>
          <Link
            href="/dashboard/topics/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            + New Topic
          </Link>
        </div>

        {userTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <div className="text-4xl">📚</div>
            <h3 className="mt-4 text-lg font-semibold">No topics yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Add your first topic and start receiving AI-curated digests about the things you care about.
            </p>
            <Link
              href="/dashboard/topics/new"
              className="mt-6 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Add your first topic
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/dashboard/topics/${topic.id}`}
                className="group rounded-lg border p-5 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {topic.title}
                  </h3>
                  <span
                    className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      topic.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {topic.active ? "Active" : "Paused"}
                  </span>
                </div>
                {topic.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {topic.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{topic.frequency === "daily" ? "📅 Daily" : "📅 Weekly"}</span>
                  <span>
                    {topic.formatPref === "text"
                      ? "📝 Text"
                      : topic.formatPref === "audio"
                        ? "🎧 Audio"
                        : "📝🎧 Both"}
                  </span>
                  <span>{topic.language === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
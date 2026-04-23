import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createTopic } from "@/lib/db/queries";
import Link from "next/link";

export default async function NewTopicPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center gap-4 px-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">New Topic</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-xl px-6 py-8">
        <form
          action={async (formData: FormData) => {
            "use server";
            const session = await auth();
            if (!session?.user?.id) redirect("/login");

            const title = formData.get("title") as string;
            const description = formData.get("description") as string;
            const frequency = formData.get("frequency") as string;
            const formatPref = formData.get("formatPref") as string;
            const language = formData.get("language") as string;

            const topic = await createTopic(session.user.id, {
              title,
              description: description || undefined,
              frequency: frequency as "daily" | "weekly",
              formatPref: formatPref as "text" | "audio" | "both",
              language,
            });

            redirect(`/dashboard/topics/${topic.id}`);
          }}
          className="space-y-6"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              minLength={2}
              maxLength={255}
              placeholder="e.g. AI & Machine Learning"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={1000}
              placeholder="What aspects of this topic interest you?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium mb-1">
                Frequency
              </label>
              <select
                id="frequency"
                name="frequency"
                defaultValue="daily"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label htmlFor="formatPref" className="block text-sm font-medium mb-1">
                Format
              </label>
              <select
                id="formatPref"
                name="formatPref"
                defaultValue="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="text">📝 Text</option>
                <option value="audio">🎧 Audio</option>
                <option value="both">📝🎧 Both</option>
              </select>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium mb-1">
                Language
              </label>
              <select
                id="language"
                name="language"
                defaultValue="pt"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="pt">🇧🇷 PT</option>
                <option value="en">🇺🇸 EN</option>
                <option value="de">🇩🇪 DE</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard"
              className="rounded-md border border-input px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Create Topic
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
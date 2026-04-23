import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold">Compendium</h1>
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold">My Topics</h2>
          <p className="mt-1 text-muted-foreground">
            Choose the subjects you care about and get daily AI-curated digests.
          </p>
        </div>

        {/* Empty state — will be replaced with real topics */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="text-4xl">📚</div>
          <h3 className="mt-4 text-lg font-semibold">No topics yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Add your first topic and start receiving AI-curated digests about the things you care about.
          </p>
          <a
            href="/dashboard/topics/new"
            className="mt-6 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Add your first topic
          </a>
        </div>
      </main>
    </div>
  );
}
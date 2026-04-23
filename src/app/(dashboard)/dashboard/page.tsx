import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserTopics } from "@/lib/db/queries";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userTopics = await getUserTopics(session.user.id);

  return (
    <DashboardShell>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">My Topics</h2>
        <p className="mt-1 text-muted-foreground">
          Choose the subjects you care about and get AI-curated digests.
        </p>
      </div>

      {userTopics.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No topics yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Add your first topic and start receiving AI-curated digests about the things you care about.
          </p>
          <Link
            href="/dashboard/topics/new"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add your first topic
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userTopics.map((topic) => (
            <Link key={topic.id} href={`/dashboard/topics/${topic.id}`}>
              <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {topic.title}
                    </CardTitle>
                    <Badge variant={topic.active ? "default" : "secondary"} className="ml-2 shrink-0">
                      {topic.active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  {topic.description && (
                    <CardDescription className="line-clamp-2">{topic.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {topic.frequency === "daily" ? "📅 Daily" : "📅 Weekly"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {topic.formatPref === "text"
                        ? "📝 Text"
                        : topic.formatPref === "audio"
                          ? "🎧 Audio"
                          : "📝🎧 Both"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {topic.language === "pt" ? "🇧🇷 PT" : topic.language === "de" ? "🇩🇪 DE" : "🇺🇸 EN"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
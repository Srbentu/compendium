import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTopicById, deleteTopic, updateTopic } from "@/lib/db/queries";
import { getTopicSources, addSource, deleteSource } from "@/lib/db/queries";
import { createSourceSchema } from "@/lib/validations/topic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Pause, Play, Trash2, X, Rss, Newspaper, MessageCircle, Tv } from "lucide-react";

const sourceIcons: Record<string, React.ReactNode> = {
  rss: <Rss className="h-4 w-4" />,
  newsapi: <Newspaper className="h-4 w-4" />,
  reddit: <MessageCircle className="h-4 w-4" />,
  youtube: <Tv className="h-4 w-4" />,
};

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
        <div className="container flex h-14 items-center gap-4 px-6">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold">{topic.title}</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-8 space-y-8">
        {/* Topic info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{topic.title}</CardTitle>
                {topic.description && (
                  <CardDescription className="mt-1">{topic.description}</CardDescription>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline">
                    {topic.frequency === "daily" ? "📅 Daily" : "📅 Weekly"}
                  </Badge>
                  <Badge variant="outline">
                    {topic.formatPref === "text"
                      ? "📝 Text"
                      : topic.formatPref === "audio"
                        ? "🎧 Audio"
                        : "📝🎧 Both"}
                  </Badge>
                  <Badge variant="outline">
                    {topic.language === "pt" ? "🇧🇷 PT" : topic.language === "de" ? "🇩🇪 DE" : "🇺🇸 EN"}
                  </Badge>
                  <Badge variant={topic.active ? "default" : "secondary"}>
                    {topic.active ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await updateTopic(session.user.id, id, { active: !topic.active });
                  revalidatePath(`/dashboard/topics/${id}`);
                }}
              >
                <Button variant="outline" size="sm" type="submit">
                  {topic.active ? (
                    <><Pause className="mr-1.5 h-3.5 w-3.5" /> Pause</>
                  ) : (
                    <><Play className="mr-1.5 h-3.5 w-3.5" /> Resume</>
                  )}
                </Button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteTopic(session.user.id, id);
                  redirect("/dashboard");
                }}
              >
                <Button variant="destructive" size="sm" type="submit">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Sources */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Sources</h3>

          {topicSources.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No sources yet. Add an RSS feed, NewsAPI query, Reddit subreddit, or YouTube channel below.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {topicSources.map((source) => (
                <Card key={source.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-muted-foreground">
                        {sourceIcons[source.type] ?? source.type}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs uppercase shrink-0">
                        {source.type}
                      </Badge>
                      <span className="text-sm truncate">{source.url}</span>
                      {source.label && (
                        <span className="text-xs text-muted-foreground shrink-0">({source.label})</span>
                      )}
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await deleteSource(topic.id, source.id);
                        revalidatePath(`/dashboard/topics/${id}`);
                      }}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" type="submit">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add source form */}
          <Card className="mt-4">
            <CardContent className="pt-6">
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
                className="flex items-end gap-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="sourceType" className="text-xs">Type</Label>
                  <Select name="sourceType" defaultValue="rss">
                    <SelectTrigger id="sourceType" className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rss">RSS</SelectItem>
                      <SelectItem value="newsapi">NewsAPI</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="sourceUrl" className="text-xs">URL</Label>
                  <Input
                    id="sourceUrl"
                    name="sourceUrl"
                    type="url"
                    required
                    placeholder="https://example.com/feed.xml"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sourceLabel" className="text-xs">Label</Label>
                  <Input
                    id="sourceLabel"
                    name="sourceLabel"
                    type="text"
                    placeholder="Optional"
                    className="w-28"
                  />
                </div>
                <Button type="submit" size="sm">Add</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
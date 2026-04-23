import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createTopic } from "@/lib/db/queries";
import { ArrowLeft } from "lucide-react";

export default async function NewTopicPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center gap-4 px-6">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold">New Topic</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create a Topic</CardTitle>
            <CardDescription>
              Choose a subject you care about. AI will curate and synthesize content for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  minLength={2}
                  maxLength={255}
                  placeholder="e.g. AI & Machine Learning"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  maxLength={1000}
                  placeholder="What aspects of this topic interest you?"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select name="frequency" defaultValue="daily">
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formatPref">Format</Label>
                  <Select name="formatPref" defaultValue="text">
                    <SelectTrigger id="formatPref">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">📝 Text</SelectItem>
                      <SelectItem value="audio">🎧 Audio</SelectItem>
                      <SelectItem value="both">📝🎧 Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select name="language" defaultValue="pt">
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">🇧🇷 Portuguese</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="de">🇩🇪 German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
                  Cancel
                </Link>
                <Button type="submit">Create Topic</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
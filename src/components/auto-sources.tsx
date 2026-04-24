"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Source {
  id: string;
  type: string;
  url: string;
  label: string | null;
  isAuto: boolean;
}

interface AutoSourcesProps {
  topicId: string;
  initialSources: Source[];
}

export function AutoSources({ topicId, initialSources }: AutoSourcesProps) {
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [loading, setLoading] = useState(initialSources.length === 0);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(initialSources.length > 0);

  const suggestSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/topics/${topicId}/suggest-sources`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to suggest sources");
      const data = await res.json();
      if (data.sources && data.sources.length > 0) {
        setSources(data.sources);
      }
    } catch {
      setError("Could not find sources automatically. Try adding them manually.");
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, [topicId]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      suggestSources();
    }
  }, [suggestSources]);

  const sourceIcons: Record<string, string> = {
    rss: "📰",
    newsapi: "🗞️",
    reddit: "💬",
    youtube: "📺",
  };

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">
            AI is finding the best sources for your topic...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={suggestSources}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <Card key={source.id}>
          <CardContent className="flex items-center gap-3 py-3">
            <span className="text-lg">{sourceIcons[source.type] ?? "🔗"}</span>
            <Badge variant="secondary" className="font-mono text-xs uppercase shrink-0">
              {source.type}
            </Badge>
            <span className="text-sm truncate flex-1">{source.url}</span>
            {source.label && (
              <span className="text-xs text-muted-foreground shrink-0">({source.label})</span>
            )}
            <Badge variant="outline" className="text-xs shrink-0">
              ✨ AI
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
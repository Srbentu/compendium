import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compendium — Intelligent Content Aggregator",
  description:
    "Choose your topics, AI curates and synthesizes, you consume your way — text or audio.",
};

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        Compendium
      </h1>
      <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl">
        Choose your topics. AI curates and synthesizes the most relevant content.
        You consume your way — text or audio.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href="/signup"
          className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="text-sm font-semibold leading-6 text-foreground"
        >
          Sign in <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </main>
  );
}
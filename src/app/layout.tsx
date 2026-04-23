import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Compendium — Intelligent Content Aggregator",
    template: "%s | Compendium",
  },
  description:
    "Choose your topics, AI curates and synthesizes, you consume your way — text or audio.",
  openGraph: {
    title: "Compendium — Intelligent Content Aggregator",
    description:
      "Choose your topics, AI curates and synthesizes, you consume your way — text or audio.",
    type: "website",
    siteName: "Compendium",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compendium — Intelligent Content Aggregator",
    description:
      "Choose your topics, AI curates and synthesizes, you consume your way — text or audio.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
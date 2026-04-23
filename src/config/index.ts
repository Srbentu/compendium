export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Compendium";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const APP_DESCRIPTION =
  "Intelligent content aggregator. Choose your topics, AI curates and synthesizes, you consume your way.";

export const SUPPORTED_LANGUAGES = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

export const FORMAT_OPTIONS = [
  { value: "text", label: "Text", icon: "FileText" },
  { value: "audio", label: "Audio", icon: "Headphones" },
  { value: "both", label: "Text + Audio", icon: "BookOpen" },
] as const;
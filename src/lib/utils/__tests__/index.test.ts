import { describe, it, expect } from "vitest";
import { generateSlug, formatDate, formatRelativeTime } from "@/lib/utils";

describe("generateSlug", () => {
  it("converts to lowercase", () => {
    expect(generateSlug("JavaScript")).toBe("javascript");
  });

  it("removes diacritics", () => {
    expect(generateSlug("São Paulo")).toBe("sao-paulo");
  });

  it("replaces spaces with hyphens", () => {
    expect(generateSlug("War in Iran")).toBe("war-in-iran");
  });

  it("removes special characters", () => {
    expect(generateSlug("C++ & Rust!")).toBe("c-rust");
  });

  it("removes leading and trailing hyphens", () => {
    expect(generateSlug("  hello world  ")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats date in English by default", () => {
    const date = new Date("2026-04-23");
    const result = formatDate(date);
    expect(result).toContain("2026");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for recent time", () => {
    const result = formatRelativeTime(new Date());
    expect(result).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
    const result = formatRelativeTime(twoHoursAgo);
    expect(result).toBe("2h ago");
  });

  it("returns days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    const result = formatRelativeTime(threeDaysAgo);
    expect(result).toBe("3d ago");
  });
});
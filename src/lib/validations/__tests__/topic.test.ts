import { describe, it, expect } from "vitest";
import { createTopicSchema, updateTopicSchema } from "@/lib/validations/topic";

describe("createTopicSchema", () => {
  it("validates a valid topic", () => {
    const result = createTopicSchema.safeParse({
      title: "JavaScript",
      frequency: "daily",
      formatPref: "text",
    });
    expect(result.success).toBe(true);
  });

  it("requires title with at least 2 characters", () => {
    const result = createTopicSchema.safeParse({
      title: "J",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("2 characters");
    }
  });

  it("limits title to 255 characters", () => {
    const result = createTopicSchema.safeParse({
      title: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("defaults frequency to daily", () => {
    const result = createTopicSchema.parse({
      title: "Test",
    });
    expect(result.frequency).toBe("daily");
  });

  it("defaults formatPref to text", () => {
    const result = createTopicSchema.parse({
      title: "Test",
    });
    expect(result.formatPref).toBe("text");
  });

  it("defaults language to pt", () => {
    const result = createTopicSchema.parse({
      title: "Test",
    });
    expect(result.language).toBe("pt");
  });

  it("accepts optional description", () => {
    const result = createTopicSchema.safeParse({
      title: "JavaScript",
      description: "Latest JS news and updates",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateTopicSchema", () => {
  it("allows partial updates", () => {
    const result = updateTopicSchema.safeParse({
      title: "Updated Topic",
    });
    expect(result.success).toBe(true);
  });

  it("allows updating active status", () => {
    const result = updateTopicSchema.safeParse({
      active: false,
    });
    expect(result.success).toBe(true);
  });

  it("allows updating multiple fields", () => {
    const result = updateTopicSchema.safeParse({
      title: "New Title",
      frequency: "weekly",
      formatPref: "audio",
    });
    expect(result.success).toBe(true);
  });
});
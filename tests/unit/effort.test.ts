import { describe, expect, it } from "vitest";
import { effortLabel, effortSummary } from "@/lib/effort";

describe("beginner effort labels", () => {
  it.each([
    [1, "Muy suave"],
    [5, "Moderado"],
    [7, "Difícil pero controlable"],
    [9, "Muy difícil"],
    [10, "Esfuerzo máximo"],
  ])("explains effort %s in plain language", (value, label) => {
    expect(effortLabel(value)).toBe(label);
  });

  it("keeps the numeric scale visible with its explanation", () => {
    expect(effortSummary(7)).toBe("7/10 · Difícil pero controlable");
  });
});

import { describe, it, expect } from "vitest";
import {
  screenForCrisis,
  INDIA_HELPLINES,
  CRISIS_MESSAGE,
} from "@/lib/crisis";

describe("screenForCrisis", () => {
  it("flags explicit self-harm intent as acute", () => {
    expect(screenForCrisis("I want to kill myself").level).toBe("acute");
    expect(screenForCrisis("there's no reason to live anymore").level).toBe(
      "acute"
    );
    expect(screenForCrisis("I can't go on like this").level).toBe("acute");
  });

  it("is case-insensitive", () => {
    expect(screenForCrisis("I WANT TO DIE").level).toBe("acute");
  });

  it("flags distress without explicit intent as elevated", () => {
    expect(screenForCrisis("I feel completely hopeless").level).toBe(
      "elevated"
    );
    expect(screenForCrisis("I just want to give up on JEE").level).toBe(
      "elevated"
    );
    expect(screenForCrisis("I had a panic attack before the mock").level).toBe(
      "elevated"
    );
  });

  it("returns none for ordinary study stress", () => {
    expect(
      screenForCrisis("I'm stressed about my physics revision").level
    ).toBe("none");
    expect(screenForCrisis("Today was a good study day").level).toBe("none");
  });

  it("prioritises acute over elevated when both appear", () => {
    const signal = screenForCrisis(
      "I feel hopeless and I want to end my life"
    );
    expect(signal.level).toBe("acute");
  });

  it("reports the matched phrases for transparency", () => {
    const signal = screenForCrisis("I want to die");
    expect(signal.matched.length).toBeGreaterThan(0);
  });

  it("does not false-positive on benign substrings", () => {
    // "die" inside "diet"/"died down" should not trigger the \bdie\b... pattern path.
    expect(screenForCrisis("my motivation died down today").level).toBe(
      "none"
    );
    expect(screenForCrisis("I changed my diet this week").level).toBe("none");
  });
});

describe("crisis resources", () => {
  it("ships at least one government helpline with a tel: link", () => {
    expect(INDIA_HELPLINES.length).toBeGreaterThanOrEqual(3);
    for (const line of INDIA_HELPLINES) {
      expect(line.href.startsWith("tel:")).toBe(true);
      expect(line.name).toBeTruthy();
    }
  });

  it("uses a static, reviewed crisis message (not model-generated)", () => {
    expect(CRISIS_MESSAGE).toContain("helpline");
  });
});

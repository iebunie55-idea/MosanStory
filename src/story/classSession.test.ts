import { describe, expect, test } from "vitest";
import { normalizeClassId } from "./classSession";

describe("normalizeClassId", () => {
  test("normalizes Mosan class IDs for young students typing on tablets", () => {
    expect(normalizeClassId(" MOSAN-001 ")).toBe("mosan-001");
    expect(normalizeClassId("mosan001")).toBe("mosan-001");
  });
});

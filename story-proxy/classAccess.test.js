import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createClassAccessStore, createClassIds } from "./classAccess.js";

describe("createClassIds", () => {
  it("creates exactly 30 reusable Mosan class IDs", () => {
    assert.deepEqual(createClassIds(), [
      "mosan-001", "mosan-002", "mosan-003", "mosan-004", "mosan-005",
      "mosan-006", "mosan-007", "mosan-008", "mosan-009", "mosan-010",
      "mosan-011", "mosan-012", "mosan-013", "mosan-014", "mosan-015",
      "mosan-016", "mosan-017", "mosan-018", "mosan-019", "mosan-020",
      "mosan-021", "mosan-022", "mosan-023", "mosan-024", "mosan-025",
      "mosan-026", "mosan-027", "mosan-028", "mosan-029", "mosan-030"
    ]);
  });
});

describe("class access store", () => {
  it("allows a valid unused ID and blocks a second tablet in the same class session", () => {
    const store = createClassAccessStore();

    assert.equal(store.login({ classId: "mosan-001", sessionToken: "tablet-a" }).ok, true);
    assert.equal(store.login({ classId: "mosan-001", sessionToken: "tablet-a" }).ok, true);
    assert.deepEqual(store.login({ classId: "mosan-001", sessionToken: "tablet-b" }), {
      ok: false,
      reason: "already_used",
      message: "이미 사용 중인 아이디예요. 선생님께 다른 아이디를 확인해 주세요."
    });
  });

  it("rejects IDs outside mosan-001 through mosan-030", () => {
    const store = createClassAccessStore();

    assert.deepEqual(store.login({ classId: "mosan-031", sessionToken: "tablet-a" }), {
      ok: false,
      reason: "invalid_id",
      message: "아이디는 mosan-001부터 mosan-030까지만 사용할 수 있어요."
    });
  });

  it("resets all IDs for the next class", () => {
    const store = createClassAccessStore();

    assert.equal(store.login({ classId: "mosan-001", sessionToken: "tablet-a" }).ok, true);
    assert.equal(store.login({ classId: "mosan-001", sessionToken: "tablet-b" }).ok, false);

    store.reset();

    assert.equal(store.login({ classId: "mosan-001", sessionToken: "tablet-b" }).ok, true);
  });

  it("limits expensive AI actions per ID in one class session", () => {
    const store = createClassAccessStore();
    store.login({ classId: "mosan-001", sessionToken: "tablet-a" });

    assert.equal(store.consumeUsage({ classId: "mosan-001", sessionToken: "tablet-a", kind: "story" }).ok, true);
    assert.equal(store.consumeUsage({ classId: "mosan-001", sessionToken: "tablet-a", kind: "story" }).ok, false);

    assert.equal(store.consumeUsage({ classId: "mosan-001", sessionToken: "tablet-a", kind: "coverImage" }).ok, true);
    assert.equal(store.consumeUsage({ classId: "mosan-001", sessionToken: "tablet-a", kind: "coverImage" }).ok, false);

    for (let index = 0; index < 4; index += 1) {
      assert.equal(store.consumeUsage({ classId: "mosan-001", sessionToken: "tablet-a", kind: "printImage" }).ok, true);
    }
    assert.equal(store.consumeUsage({ classId: "mosan-001", sessionToken: "tablet-a", kind: "printImage" }).ok, false);
  });
});

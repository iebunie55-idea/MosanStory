import { describe, expect, test } from "vitest";
import { classSessionStorageKey, createClassIdChangeState, decideClassLogin, isAllowedClassId, normalizeClassId } from "./classSession";

describe("normalizeClassId", () => {
  test("normalizes Mosan class IDs for young students typing on tablets", () => {
    expect(normalizeClassId(" MOSAN-001 ")).toBe("mosan-001");
    expect(normalizeClassId("mosan001")).toBe("mosan-001");
  });
});

describe("isAllowedClassId", () => {
  test("allows only the 30 reusable classroom IDs", () => {
    expect(isAllowedClassId("mosan-001")).toBe(true);
    expect(isAllowedClassId("mosan-030")).toBe(true);
    expect(isAllowedClassId("mosan-031")).toBe(false);
    expect(isAllowedClassId("mosan-000")).toBe(false);
  });
});

describe("decideClassLogin", () => {
  test("allows an unused ID and marks it as active", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "unused" }, "device-a")).toEqual({
      ok: true,
      nextStatus: "active",
      message: "모산초 동화 만들기를 시작해요."
    });
  });

  test("allows the same tablet to resume an active ID", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "active", sessionToken: "device-a" }, "device-a").ok).toBe(true);
  });

  test("blocks an active ID from another tablet", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "active", sessionToken: "device-a" }, "device-b")).toEqual({
      ok: false,
      nextStatus: "active",
      message: "이미 다른 태블릿에서 사용 중인 아이디예요. 선생님께 알려주세요."
    });
  });

  test("blocks completed IDs", () => {
    expect(decideClassLogin({ id: "mosan-001", status: "completed" }, "device-a")).toEqual({
      ok: false,
      nextStatus: "completed",
      message: "이미 동화책을 완성한 아이디예요. 다시 필요하면 선생님께 알려주세요."
    });
  });
});

describe("classSessionStorageKey", () => {
  test("uses a stable storage key for the class session token", () => {
    expect(classSessionStorageKey).toBe("mosan-story.classSession.v1");
  });
});

describe("createClassIdChangeState", () => {
  test("clears the local tablet session and prompts for another class ID", () => {
    expect(createClassIdChangeState()).toEqual({
      classId: "",
      classSessionToken: "",
      classIdInput: "",
      classLoginMessage: "다른 수업 아이디를 입력해 주세요."
    });
  });
});

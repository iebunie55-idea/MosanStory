export type ClassSessionStatus = "unused" | "active" | "completed";

export type ClassSessionRecord = {
  id: string;
  status: ClassSessionStatus;
  sessionToken?: string;
};

export type ClassLoginDecision = {
  ok: boolean;
  nextStatus: ClassSessionStatus;
  message: string;
};

export function normalizeClassId(value: string) {
  const compact = value.trim().toLowerCase().replace(/\s+/g, "");
  const match = compact.match(/^mosan-?(\d{1,3})$/);

  if (!match) return compact;

  return `mosan-${match[1].padStart(3, "0")}`;
}

export function decideClassLogin(record: ClassSessionRecord, currentSessionToken: string): ClassLoginDecision {
  if (record.status === "unused") {
    return { ok: true, nextStatus: "active", message: "모산초 동화 만들기를 시작해요." };
  }

  if (record.status === "active" && record.sessionToken === currentSessionToken) {
    return { ok: true, nextStatus: "active", message: "이어서 동화를 만들어요." };
  }

  if (record.status === "active") {
    return {
      ok: false,
      nextStatus: "active",
      message: "이미 다른 태블릿에서 사용 중인 아이디예요. 선생님께 알려주세요."
    };
  }

  return {
    ok: false,
    nextStatus: "completed",
    message: "이미 동화책을 완성한 아이디예요. 다시 필요하면 선생님께 알려주세요."
  };
}

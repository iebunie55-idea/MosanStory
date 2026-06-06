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

export const classSessionStorageKey = "mosan-story.classSession.v1";
export const classSessionResetCodeStorageKey = "mosan-story.classResetCode.v1";
const storyProxyUrl = process.env.NEXT_PUBLIC_STORY_PROXY_URL?.replace(/\/$/, "") || "http://localhost:3001";

export function normalizeClassId(value: string) {
  const compact = value.trim().toLowerCase().replace(/\s+/g, "");
  const match = compact.match(/^mosan-?(\d{1,3})$/);

  if (!match) return compact;

  return `mosan-${match[1].padStart(3, "0")}`;
}

export function isAllowedClassId(value: string) {
  const normalized = normalizeClassId(value);
  const match = normalized.match(/^mosan-(\d{3})$/);
  if (!match) return false;

  const idNumber = Number(match[1]);
  return idNumber >= 1 && idNumber <= 30;
}

export function createClassSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `mosan-device-${crypto.randomUUID()}`;
  }

  return `mosan-device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchClassAccess(path: string, body: Record<string, string>) {
  const response = await fetch(`${storyProxyUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = (await response.json()) as {
    ok?: boolean;
    classId?: string;
    sessionToken?: string;
    message?: string;
    reason?: string;
  };

  if (!response.ok) {
    return {
      ok: false,
      message: data.message || "수업 아이디를 확인할 수 없어요.",
      reason: data.reason || "request_failed"
    };
  }

  return {
    ok: Boolean(data.ok),
    classId: data.classId,
    sessionToken: data.sessionToken,
    message: data.message || "좋아요. 이제 나만의 동화책을 만들어요.",
    reason: data.reason
  };
}

export async function requestClassLogin(classId: string, sessionToken: string) {
  try {
    return await fetchClassAccess("/api/class-login", { classId, sessionToken });
  } catch {
    return {
      ok: false,
      message: "수업 서버에 연결할 수 없어요. 선생님께 알려주세요.",
      reason: "network_error"
    };
  }
}

export async function resetClassAccess(resetCode: string) {
  try {
    return await fetchClassAccess("/api/class-reset", { resetCode });
  } catch {
    return {
      ok: false,
      message: "수업 서버에 연결할 수 없어요. 프록시 서버를 확인해 주세요.",
      reason: "network_error"
    };
  }
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

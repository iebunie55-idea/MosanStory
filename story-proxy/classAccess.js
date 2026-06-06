const classIdCount = 30;
const usageLimits = {
  story: 1,
  coverImage: 1,
  printImage: 4
};

export function createClassIds(count = classIdCount) {
  return Array.from({ length: count }, (_, index) => `mosan-${String(index + 1).padStart(3, "0")}`);
}

export function normalizeClassId(value) {
  const compact = String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const match = compact.match(/^mosan-?(\d{1,3})$/);
  return match ? `mosan-${match[1].padStart(3, "0")}` : compact;
}

function createRecord(classId, sessionToken) {
  return {
    classId,
    sessionToken,
    usage: {
      story: 0,
      coverImage: 0,
      printImage: 0
    }
  };
}

export function createClassAccessStore({ ids = createClassIds() } = {}) {
  const allowedIds = new Set(ids);
  const activeSessions = new Map();

  function login({ classId, sessionToken }) {
    const normalizedId = normalizeClassId(classId);
    if (!allowedIds.has(normalizedId)) {
      return {
        ok: false,
        reason: "invalid_id",
        message: "아이디는 mosan-001부터 mosan-030까지만 사용할 수 있어요."
      };
    }

    if (!sessionToken) {
      return {
        ok: false,
        reason: "missing_session",
        message: "태블릿 세션을 확인할 수 없어요. 다시 시도해 주세요."
      };
    }

    const current = activeSessions.get(normalizedId);
    if (current && current.sessionToken !== sessionToken) {
      return {
        ok: false,
        reason: "already_used",
        message: "이미 사용 중인 아이디예요. 선생님께 다른 아이디를 확인해 주세요."
      };
    }

    const record = current || createRecord(normalizedId, sessionToken);
    activeSessions.set(normalizedId, record);
    return {
      ok: true,
      classId: normalizedId,
      sessionToken,
      message: "좋아요. 이제 나만의 동화책을 만들어요.",
      usage: { ...record.usage }
    };
  }

  function consumeUsage({ classId, sessionToken, kind }) {
    const loginResult = login({ classId, sessionToken });
    if (!loginResult.ok) return loginResult;

    const normalizedId = loginResult.classId;
    const record = activeSessions.get(normalizedId);
    const limit = usageLimits[kind];
    if (!record || !limit) {
      return {
        ok: false,
        reason: "invalid_usage_kind",
        message: "사용량 종류를 확인할 수 없어요."
      };
    }

    if (record.usage[kind] >= limit) {
      return {
        ok: false,
        reason: "usage_limit",
        message: "이 아이디로 사용할 수 있는 AI 생성 횟수를 모두 사용했어요."
      };
    }

    record.usage[kind] += 1;
    return {
      ok: true,
      classId: normalizedId,
      sessionToken,
      usage: { ...record.usage }
    };
  }

  function reset() {
    activeSessions.clear();
    return {
      ok: true,
      message: "수업 아이디 30개를 다시 사용할 수 있어요."
    };
  }

  return {
    ids,
    login,
    consumeUsage,
    reset
  };
}

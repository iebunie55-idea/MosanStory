import type { StoryResult, StorySelection } from "./storyTypes";

const PROXY_URL =
  process.env.NEXT_PUBLIC_STORY_PROXY_URL?.replace(/\/$/, "") || "http://localhost:3001";

function hasFinalConsonant(text: string) {
  const last = text.trim().charCodeAt(text.trim().length - 1);
  return last >= 0xac00 && last <= 0xd7a3 ? (last - 0xac00) % 28 !== 0 : false;
}

function topic(name: string) {
  return `${name}${hasFinalConsonant(name) ? "이" : "가"}`;
}

function contrast(name: string) {
  return `${name}${hasFinalConsonant(name) ? "은" : "는"}`;
}

function objectParticle(name: string) {
  return `${name}${hasFinalConsonant(name) ? "을" : "를"}`;
}

function cleanStoryText(text: string) {
  return text
    .replaceAll("영뚱한", "엉뚱한")
    .replaceAll("요요", "요")
    .replaceAll("\"", "")
    .replaceAll("“", "")
    .replaceAll("”", "")
    .trim();
}

function eventScene(id: string, fallback: string) {
  if (id.startsWith("custom-")) {
    return fallback.replace(/[.!?~]+$/, "").replace(/했어요$/, "했어요");
  }

  const scenes: Record<string, string> = {
    "lost-light": "풀잎 사이에서 작은 빛이 반짝이며 길을 알려 주었어요",
    letter: "꽃잎에 숨겨진 비밀 편지가 살며시 펼쳐졌어요",
    festival: "마을 곳곳에 깃발이 걸리고 즐거운 축제가 시작되었어요",
    friend: "길모퉁이에서 도움이 필요한 새 친구를 만났어요",
    sound: "어디선가 또르르 울리는 낯선 소리가 들려왔어요",
    door: "나무뿌리 아래 작은 문이 조용히 열렸어요",
    map: "오래된 지도에는 아직 아무도 가 보지 못한 길이 그려져 있었어요",
    promise: "친구와 한 약속을 지키기 위해 한 걸음 더 나아갔어요",
    puzzle: "반짝이는 돌판의 수수께끼를 하나씩 맞혀 보았어요",
    bridge: "흔들리는 다리를 고치려면 모두의 힘이 필요했어요",
    helper: "길을 잘 아는 친구가 나타나 조용히 손짓해 주었어요",
    trail: "바닥에 남은 반짝이는 흔적이 다음 길을 알려 주었어요",
    storm: "갑자기 큰 바람이 불어 길 위의 꽃잎들이 빙글빙글 날렸어요",
    dark: "주변이 어두워지자 모두가 잠시 발걸음을 멈추었어요",
    missing: "꼭 필요했던 물건이 보이지 않아 모두가 걱정했어요",
    choice: "두 갈래 길 앞에서 어떤 길이 옳은지 골라야 했어요",
    tower: "높은 탑 위에 마지막 단서가 반짝이고 있었어요",
    gate: "굳게 닫힌 문 앞에서 모두가 숨을 죽였어요",
    share: "모두가 찾은 기쁨을 서로 나누며 활짝 웃었어요",
    home: "따뜻한 불빛이 켜진 집으로 함께 돌아왔어요",
    garden: "빈터에는 모두가 함께 가꾼 새 정원이 생겼어요",
    memory: "오늘의 모험은 오래도록 잊지 못할 추억이 되었어요",
    party: "작은 축하 파티가 열리고 웃음소리가 가득 퍼졌어요",
    "promise-again": "친구들은 다음에 또 만나자고 손가락을 걸고 약속했어요"
  };

  return scenes[id] || fallback.replace(/했어요$/, "하는 일이 생겼어요");
}

export function localStory(selection: StorySelection): StoryResult {
  const hero = selection.character.name;
  const heroTopic = topic(hero);
  const heroContrast = contrast(hero);
  const heroObject = objectParticle(hero);
  const trait = selection.trait.label;
  const place = selection.place.name;
  const { opening, development, climax, ending } = selection.events;
  const openingScene = eventScene(opening.id, opening.label);
  const developmentScene = eventScene(development.id, development.label);
  const climaxScene = eventScene(climax.id, climax.label);
  const endingScene = eventScene(ending.id, ending.label);

  return {
    source: "local",
    pages: [
      `${place}에는 ${trait} ${heroObject} 아끼는 친구들이 살고 있었어요. ${heroContrast} 오늘도 주변을 살피며 작은 모험을 기다렸어요.`,
      `그날 ${openingScene}. ${heroTopic} 그냥 지나치지 않고, 그 빛과 소리가 어디에서 왔는지 알아보기로 했어요.`,
      `길을 따라가던 ${heroContrast} ${developmentScene}. 친구들도 힘을 보태자, 흩어져 있던 단서들이 하나의 길처럼 이어졌어요.`,
      `하지만 곧 ${climaxScene}. ${heroContrast} 겁이 났지만 ${trait} 마음을 떠올리며 친구들 앞에 섰어요.`,
      `${heroTopic} 혼자 해결하려 하지 않고 친구들의 생각을 차례로 들었어요. 모두의 마음이 모이자 막혀 있던 길이 천천히 열렸어요.`,
      `마침내 ${endingScene}. ${heroContrast} 함께하면 어려운 일도 따뜻한 추억이 된다는 것을 알게 되었어요.`
    ].map(cleanStoryText)
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function generateStory(selection: StorySelection): Promise<StoryResult> {
  try {
    const response = await fetchWithTimeout(
      `${PROXY_URL}/api/story`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection })
      },
      10000
    );

    if (!response.ok) {
      throw new Error("story proxy failed");
    }

    const data = (await response.json()) as { scenes?: unknown; provider?: string };
    if (!Array.isArray(data.scenes) || data.scenes.length < 6) {
      throw new Error("invalid story payload");
    }

    return {
      pages: data.scenes.slice(0, 6).map((scene) => cleanStoryText(String(scene))),
      provider: data.provider,
      source: "ai"
    };
  } catch {
    return localStory(selection);
  }
}

export async function generateSceneImage(
  selection: StorySelection,
  scene: string,
  pageIndex: number
): Promise<{ imageDataUrl: string; prompt: string } | null> {
  try {
    const response = await fetchWithTimeout(
      `${PROXY_URL}/api/image`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection, scene, pageIndex })
      },
      45000
    );

    if (!response.ok) {
      throw new Error("image proxy failed");
    }

    const data = (await response.json()) as { imageBase64?: string; mimeType?: string; prompt?: string };
    if (!data.imageBase64) {
      throw new Error("missing image data");
    }

    return {
      imageDataUrl: `data:${data.mimeType || "image/png"};base64,${data.imageBase64}`,
      prompt: data.prompt || ""
    };
  } catch {
    return null;
  }
}

export async function checkProxyHealth() {
  try {
    const response = await fetchWithTimeout(`${PROXY_URL}/api/health`, { method: "GET" }, 3000);
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as {
      ok: boolean;
      provider: string;
      model: string;
      keyLoaded: boolean;
    };
  } catch {
    return null;
  }
}

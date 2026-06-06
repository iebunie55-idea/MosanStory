import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createClassAccessStore } from "./classAccess.js";
import { buildGeminiImageRequest, extractGeminiImageResult } from "./geminiImage.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const providerName = (process.env.PROVIDER || "gemini").toLowerCase();
const maxPerMinute = Number(process.env.MAX_PER_MIN || 20);
const classResetCode = process.env.CLASS_RESET_CODE || "mosan-reset";
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : true;
// Gemini 네이티브 이미지 생성 (무료 티어 지원)
const geminiImageModel = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const geminiThinkingBudget = Number(process.env.GEMINI_THINKING_BUDGET ?? 0);
const rateBuckets = new Map();
const classAccess = createClassAccessStore();

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "64kb" }));

const providers = {
  gemini: {
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    key: process.env.GEMINI_API_KEY,
    call: callGemini
  },
  claude: {
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
    key: process.env.ANTHROPIC_API_KEY,
    call: callClaude
  },
  openai: {
    model: process.env.OPENAI_MODEL || "gpt-4.1-nano",
    key: process.env.OPENAI_API_KEY,
    baseUrl: "https://api.openai.com/v1/chat/completions",
    call: callOpenAICompatible
  },
  upstage: {
    model: process.env.UPSTAGE_MODEL || "solar-pro2",
    key: process.env.UPSTAGE_API_KEY,
    baseUrl: "https://api.upstage.ai/v1/chat/completions",
    call: callOpenAICompatible
  },
  grok: {
    model: process.env.GROK_MODEL || "grok-4.1",
    key: process.env.GROK_API_KEY,
    baseUrl: "https://api.x.ai/v1/chat/completions",
    call: callOpenAICompatible
  }
};

function selectedProvider() {
  return providers[providerName] || providers.gemini;
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { count: 0, resetAt: now + 60000 };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60000;
  }

  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  return bucket.count > maxPerMinute;
}

function buildPrompt(selection) {
  const events = selection.events || {};
  return [
    "아래 설정으로 동화 한 편을 써 줘.",
    `- 주인공: ${selection.character?.name || "주인공"} (성격: ${selection.trait?.label || "다정한"})`,
    `- 배경: ${selection.place?.name || "평화로운 마을"}`,
    `- 이야기 흐름: 발단 ${events.opening?.label || ""}, 전개 ${events.development?.label || ""}, 절정 ${events.climax?.label || ""}, 결말 ${events.ending?.label || ""}`,
    "중요 소재 반영 규칙:",
    `- 2쪽 발단에는 반드시 '${events.opening?.label || ""}'의 핵심 소재가 보여야 한다.`,
    `- 3쪽 전개에는 반드시 '${events.development?.label || ""}'의 핵심 행동이 이어져야 한다.`,
    `- 4쪽 절정에는 반드시 '${events.climax?.label || ""}'의 핵심 문제가 나타나야 한다.`,
    `- 6쪽 결말에는 반드시 '${events.ending?.label || ""}'의 핵심 결과가 드러나야 한다.`,
    "- 문장을 글자 그대로 복사할 필요는 없지만, 연꽃/작은 배/연못의 빛/등불처럼 사용자가 넣은 핵심 명사는 빠뜨리지 않는다.",
    "조건:",
    "1) 정확히 6쪽짜리 동화로 쓴다.",
    "2) 1쪽은 배경과 주인공 소개, 2쪽은 발단, 3쪽은 전개, 4쪽은 절정, 5쪽은 해결 행동, 6쪽은 결말과 배운 점으로 구성한다.",
    "3) 선택한 사건 문장을 그대로 복사하거나 따옴표로 넣지 말고, 자연스러운 장면으로 바꾸어 쓴다.",
    "4) 각 쪽은 1문장으로 쓰고, 45~75자 안에서 쉬운 낱말과 존댓말(\"~했어요\")을 쓴다.",
    "5) 이전 쪽의 결과 때문에 다음 쪽 사건이 일어나도록 원인과 결과를 이어 준다.",
    "6) 주인공의 성격이 문제를 해결하는 행동으로 드러나야 한다.",
    "7) 주인공 이름의 조사를 받침에 맞게 올바르게 쓴다.",
    "8) 따뜻하고 교훈이 은은한 결말로 마무리한다.",
    "9) 선택한 성격이 '엉뚱한'이면 반드시 '엉뚱한'으로 쓰고, '영뚱한'처럼 틀리게 쓰지 않는다.",
    "10) 따옴표를 쓰지 않는다.",
    "반드시 길이 6짜리 JSON 문자열 배열로만 출력한다.",
    "형식 예: [\"1쪽\",\"2쪽\",\"3쪽\",\"4쪽\",\"5쪽\",\"6쪽\"]"
  ].join("\n");
}

function buildImagePrompt(selection, scene, pageIndex) {
  const character = selection.character?.name || "주인공";
  const trait = selection.trait?.label || "다정한";
  const place = selection.place?.name || "환상적인 마을";
  const characterId = selection.character?.id || "hero";
  const placeKey = selection.place?.sceneKey || "village";
  const palette = {
    kong: "cream white rabbit-like child hero with very long rounded ears, blush pink cheeks, tiny paws, soft pastel pink scarf",
    gaya: "brave Korean girl child with warm golden jacket, round face, short dark hair, curious bright eyes",
    dani: "Korean boy child with sky-blue hoodie, round face, neat dark hair, gentle smile",
    robot: "small friendly rounded robot with lavender metal body, teal screen face, soft glowing eyes",
    miyo: "small orange-and-cream cat hero with round cheeks, bright eyes, tiny satchel",
    buri: "baby dragon hero with mint green scales, tiny wings, round snout, kind eyes"
  };
  const settingBible = {
    village: "peaceful fantasy village at sunset, round clay houses, warm windows, soft hills",
    forest: "magical fairy forest, oversized mushrooms, glowing flowers, leafy arches, sunbeams",
    island: "dreamlike island, turquoise water, round rocks, colorful flowers, soft clouds",
    sea: "sparkling underwater world, coral gardens, bubbles, gentle blue light",
    cloud: "castle above the clouds, soft white cloud bridges, pearl towers, pastel sky",
    hyeonchungsa: "Hyeonchungsa shrine in Asan, quiet historic Korean memorial grounds, traditional tiled buildings, pine trees, respectful warm atmosphere",
    oeam: "Oeam Folk Village in Asan, traditional Korean hanok houses, stone walls, old village paths, gentle rural heritage atmosphere"
  };

  return [
    "Create one original children's storybook scene illustration.",
    "Visual direction: warm 3D animated feature film look, rounded toy-like characters, soft cinematic lighting, expressive faces, colorful magical atmosphere, high detail, family friendly, no text, no logos, no copyrighted characters, no imitation of an existing studio or franchise.",
    "Maintain strict visual continuity across all pages of the same book.",
    `Character bible: ${palette[characterId] || palette.kong}. This is the single named protagonist. Keep the exact same species, face shape, eye color, body proportions, outfit, scarf/accessories, colors, and facial features on every page.`,
    "Do not redesign the protagonist between pages. Do not change the protagonist into a different animal, different age, different costume, or different color palette.",
    "Supporting characters may appear only when needed by the story, but keep them small and secondary. They must not distract from, replace, duplicate, or be confused with the protagonist.",
    "Do not include Mori, the app guide mascot, logos, watermark, text labels, captions, or any extra sticker-like overlay inside the generated illustration.",
    `Setting bible: ${settingBible[placeKey] || settingBible.village}. Keep the same world design, palette, lighting mood, and material style across pages.`,
    "Use a consistent square storybook composition: protagonist clearly visible in the foreground or middle ground, clear foreground action, soft background depth, no extreme camera angle changes, no cropping that makes the character unrecognizable.",
    `Scene number: ${Number(pageIndex) + 1} of 6. Only selected pages are illustrated automatically, and the final page must work as a satisfying ending image.`,
    `Main character: ${character}, personality: ${trait}.`,
    `Setting: ${place}.`,
    `Story moment in Korean: ${scene}`,
    "Composition: one clear main action, cozy emotion, child-safe, readable at kiosk distance."
  ].join("\n");
}

const systemPrompt = [
  "너는 한국 어린이를 위한 따뜻하고 상상력 넘치는 동화 작가다.",
  "초·중등 학생이 읽을 수 있도록 쉽고 바른 우리말, 존댓말을 쓴다.",
  "폭력적이거나 무섭거나 차별적인 표현은 절대 쓰지 않는다.",
  "요청한 출력 형식(JSON 배열) 외에는 어떤 글자도 출력하지 않는다."
].join("\n");

function parseScenes(rawText) {
  const text = String(rawText || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const candidates = [text];
  const firstArray = text.indexOf("[");
  const lastArray = text.lastIndexOf("]");
  const firstObject = text.indexOf("{");
  const lastObject = text.lastIndexOf("}");

  if (firstArray >= 0 && lastArray > firstArray) {
    candidates.push(text.slice(firstArray, lastArray + 1));
  }

  if (firstObject >= 0 && lastObject > firstObject) {
    candidates.push(text.slice(firstObject, lastObject + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const scenes = Array.isArray(parsed) ? parsed : parsed.scenes || parsed.pages;
      if (Array.isArray(scenes) && scenes.length >= 6) {
        return scenes.slice(0, 6).map((scene) => String(scene).trim()).filter(Boolean);
      }
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error("Could not parse scenes from provider response");
}

async function fetchJson(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Provider HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(provider, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.key}`;
  const generationConfig = {
    maxOutputTokens: 2048,
    responseMimeType: "application/json"
  };

  if (provider.model.includes("2.5") && Number.isFinite(geminiThinkingBudget)) {
    generationConfig.thinkingConfig = { thinkingBudget: geminiThinkingBudget };
  }

  const data = await fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig
    })
  }, 15000);

  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n") || "";
}

async function callClaude(provider, prompt) {
  const data = await fetchJson("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }]
    })
  });

  return data.content?.map((part) => part.text).join("\n") || "";
}

async function callOpenAICompatible(provider, prompt) {
  const data = await fetchJson(provider.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    })
  });

  return data.choices?.[0]?.message?.content || "";
}

async function callGeminiImage(prompt) {
  const key = providers.gemini.key;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const request = buildGeminiImageRequest({ model: geminiImageModel, key, prompt });
  const data = await fetchJson(request.url, request.options, 45000);
  return extractGeminiImageResult(data);
}

function validateSelection(selection) {
  return Boolean(
    selection &&
      selection.character?.name &&
      selection.trait?.label &&
      selection.place?.name &&
      selection.events?.opening?.label &&
      selection.events?.development?.label &&
      selection.events?.climax?.label &&
      selection.events?.ending?.label
  );
}

app.get("/api/health", (req, res) => {
  const provider = selectedProvider();
  res.json({
    ok: true,
    provider: providerName in providers ? providerName : "gemini",
    model: provider.model,
    keyLoaded: Boolean(provider.key),
    imageModel: geminiImageModel,
    imageKeyLoaded: Boolean(providers.gemini.key),
    thinkingBudget: geminiThinkingBudget
  });
});

app.post("/api/class-login", (req, res) => {
  const result = classAccess.login({
    classId: req.body?.classId,
    sessionToken: req.body?.sessionToken
  });

  return res.status(result.ok ? 200 : 403).json(result);
});

app.post("/api/class-reset", (req, res) => {
  if (String(req.body?.resetCode || "") !== classResetCode) {
    return res.status(403).json({
      ok: false,
      reason: "invalid_reset_code",
      message: "초기화 코드를 확인해 주세요."
    });
  }

  return res.json(classAccess.reset());
});

app.post("/api/story", async (req, res) => {
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: "rate_limited" });
  }

  const provider = selectedProvider();
  if (!provider.key) {
    return res.status(503).json({ error: "missing_api_key" });
  }

  const selection = req.body?.selection;
  if (!validateSelection(selection)) {
    return res.status(400).json({ error: "invalid_selection" });
  }

  const access = classAccess.consumeUsage({
    classId: req.body?.classId,
    sessionToken: req.body?.sessionToken,
    kind: "story"
  });
  if (!access.ok) {
    return res.status(403).json({ error: "class_access_denied", ...access });
  }

  try {
    const prompt = buildPrompt(selection);
    const rawText = await provider.call(provider, prompt);
    const scenes = parseScenes(rawText);
    return res.json({ scenes, provider: providerName in providers ? providerName : "gemini" });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: "provider_failed" });
  }
});

app.post("/api/image", async (req, res) => {
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: "rate_limited" });
  }

  if (!providers.gemini.key) {
    return res.status(503).json({ error: "missing_gemini_api_key" });
  }

  const selection = req.body?.selection;
  const scene = req.body?.scene;
  const pageIndex = Number(req.body?.pageIndex || 0);
  const mode = req.body?.mode === "print" ? "printImage" : "coverImage";

  if (!validateSelection(selection) || typeof scene !== "string" || !scene.trim()) {
    return res.status(400).json({ error: "invalid_image_request" });
  }

  const access = classAccess.consumeUsage({
    classId: req.body?.classId,
    sessionToken: req.body?.sessionToken,
    kind: mode
  });
  if (!access.ok) {
    return res.status(403).json({ error: "class_access_denied", ...access });
  }

  try {
    const prompt = buildImagePrompt(selection, scene, pageIndex);
    const { b64, mimeType } = await callGeminiImage(prompt);
    return res.json({ imageBase64: b64, mimeType, prompt, provider: "gemini", model: geminiImageModel });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: "image_provider_failed" });
  }
});

app.listen(port, () => {
  const provider = selectedProvider();
  console.log(`Story proxy listening on http://localhost:${port}`);
  console.log(`Provider: ${providerName in providers ? providerName : "gemini"} / ${provider.model}`);
  console.log(`API key loaded: ${Boolean(provider.key)}`);
});

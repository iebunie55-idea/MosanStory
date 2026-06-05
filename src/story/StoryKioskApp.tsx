"use client";

import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  HomeIcon,
  MusicalNoteIcon,
  PrinterIcon,
  SparklesIcon
} from "@heroicons/react/24/solid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildStoryPdfMetadata } from "./pdfMetadata";
import { classSessionStorageKey, normalizeClassId } from "./classSession";
import { characters, eventGroups, places, traits } from "./storyData";
import { checkProxyHealth, generateSceneImage, generateStory, localStory } from "./storyEngine";
import { nextMusicState, type StoryMusicState } from "./storyMusic";
import type { CharacterChoice, Choice, PlaceChoice, StoryResult, StorySelection } from "./storyTypes";

type Step = "login" | "attract" | "character" | "trait" | "place" | "events" | "loading" | "result";
type ImageGenerationMode = "cover" | "print" | null;
type SavedStory = {
  id: string;
  createdAt: string;
  character: CharacterChoice;
  trait: Choice;
  place: PlaceChoice;
  events: StorySelection["events"];
  story: StoryResult;
  sceneImages: Record<number, string>;
};

const stepOrder: Step[] = ["character", "trait", "place", "events"];
const stepLabels = ["주인공", "성격", "배경", "사건"];

const defaultCharacter = characters[0];
const defaultTrait = traits[0];
const defaultPlace = places[0];
const savedStoriesKey = "buyeo-ai-story.savedStories.v1";
const maxSavedStories = 8;
const blockedCustomWords = ["바보", "죽", "살인", "폭력", "피", "혐오", "욕", "나쁜말"];
const schoolLabel = "모산초등학교 3~6학년 동화 만들기";

function sanitizeCustomChoice(value: string) {
  return value
    .replace(/[^\u3131-\u318e\uac00-\ud7a3a-zA-Z0-9 .,!?~\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}

function isBlockedCustomChoice(value: string) {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  return blockedCustomWords.some((word) => normalized.includes(word));
}

function readSavedStories() {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(savedStoriesKey);
    if (!value) return [];
    const stories = JSON.parse(value);
    if (!Array.isArray(stories)) return [];

    const validStories = stories.filter((story): story is SavedStory => {
      return Boolean(
        story &&
          typeof story.id === "string" &&
          typeof story.createdAt === "string" &&
          story.character &&
          typeof story.character.id === "string" &&
          typeof story.character.name === "string" &&
          story.trait &&
          typeof story.trait.id === "string" &&
          typeof story.trait.label === "string" &&
          story.place &&
          typeof story.place.id === "string" &&
          typeof story.place.name === "string" &&
          story.events &&
          story.story &&
          Array.isArray(story.story.pages)
      );
    });

    if (validStories.length !== stories.length) {
      writeSavedStories(validStories);
    }

    return validStories;
  } catch {
    window.localStorage.removeItem(savedStoriesKey);
    return [];
  }
}

function writeSavedStories(stories: SavedStory[]) {
  try {
    window.localStorage.setItem(savedStoriesKey, JSON.stringify(stories.slice(0, maxSavedStories)));
  } catch {
    window.localStorage.removeItem(savedStoriesKey);
  }
}

function readClassSession() {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(classSessionStorageKey);
    if (!value) return null;
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.classId === "string" && typeof parsed.sessionToken === "string") {
      return parsed as { classId: string; sessionToken: string };
    }
  } catch {
    window.localStorage.removeItem(classSessionStorageKey);
  }

  return null;
}

function writeClassSession(classId: string) {
  const current = readClassSession();
  const sessionToken = current?.classId === classId ? current.sessionToken : `mosan-device-${Date.now()}`;
  const next = { classId, sessionToken };
  window.localStorage.setItem(classSessionStorageKey, JSON.stringify(next));
  return next;
}

function formatSavedStoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "저장된 동화";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function mascotGuideForStep(step: Step, characterName: string) {
  switch (step) {
    case "character":
      return "1단계: 주인공을 골라주세요.";
    case "trait":
      return `2단계: ${characterName}의 성격을 선택해주세요.`;
    case "place":
      return "3단계: 이야기 배경을 골라주세요.";
    case "events":
      return "4단계: 기승전결 사건을 차례대로 선택해주세요.";
    case "loading":
      return "멋진 동화를 만들고 있어요. 잠시만 기다려주세요.";
    case "result":
      return "";
    default:
      return "";
  }
}

function buildSelection(
  character: CharacterChoice,
  trait: Choice,
  place: PlaceChoice,
  events: StorySelection["events"]
): StorySelection {
  return {
    character: { id: character.id, name: character.name, emoji: character.emoji },
    trait,
    place: { id: place.id, name: place.name, sceneKey: place.sceneKey },
    events
  };
}

function choiceButtonClass(active: boolean) {
  return [
    "group min-h-20 rounded-3xl border-2 p-4 text-left shadow-[0_0_22px_rgba(36,77,255,0.16)] transition duration-200 ease-out",
    "active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#F2B33D]/40",
    active
      ? "border-[#FFB15D] bg-[#2E2442] text-white shadow-[0_0_28px_rgba(255,177,93,0.28)]"
      : "border-[#73DFFF]/25 bg-[#151F41] text-[#E8FCFF] hover:-translate-y-1 hover:border-[#FFB15D]"
  ].join(" ");
}

function compactChoiceButtonClass(active: boolean) {
  return [
    "group min-h-0 rounded-2xl border-2 p-3 text-left shadow-[0_0_18px_rgba(36,77,255,0.13)] transition duration-200 ease-out",
    "active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#F2B33D]/40",
    active
      ? "border-[#FFB15D] bg-[#2E2442] text-white shadow-[0_0_24px_rgba(255,177,93,0.24)]"
      : "border-[#73DFFF]/25 bg-[#151F41] text-[#E8FCFF] hover:-translate-y-0.5 hover:border-[#FFB15D]"
  ].join(" ");
}

function Progress({ activeStep }: { activeStep: Step }) {
  const index = Math.max(0, stepOrder.indexOf(activeStep));

  return (
    <div className="flex items-center gap-3" aria-label="진행 단계">
      {stepLabels.map((label, itemIndex) => {
        const active = itemIndex <= index;
        return (
          <div key={label} className="flex items-center gap-2">
                <span
                  className={[
                    "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-black",
                    active ? "border-[#FFB15D] bg-[#F0633C] text-white" : "border-[#73DFFF]/30 bg-[#101A38]/80 text-[#D4F5FF]"
                  ].join(" ")}
                >
              {itemIndex + 1}
            </span>
            <span className="hidden text-sm font-bold text-[#D4F5FF] md:inline">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({
  health
}: {
  health: { ok: boolean; provider: string; model: string; keyLoaded: boolean } | null;
}) {
  const connected = Boolean(health?.ok && health.keyLoaded);

  return (
    <div className="rounded-full border border-[#7DE8FF]/30 bg-[#101A38]/80 px-4 py-2 text-sm font-black text-white shadow-[0_0_22px_rgba(125,232,255,0.18)]">
      <span className={connected ? "text-[#7DFFD4]" : "text-[#FFD073]"}>{connected ? "AI 연결됨" : "내장 엔진 준비"}</span>
      {health?.provider ? <span className="ml-2 text-[#D4F5FF]">{health.provider}</span> : null}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-16 items-center justify-center gap-3 rounded-2xl border-2 border-[#FFB15D] bg-[#F0633C] px-8 text-lg font-black text-white shadow-[0_0_26px_rgba(240,99,60,0.32)] transition hover:-translate-y-1 hover:bg-[#D94E2B] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#6B5C72] disabled:shadow-none"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled = false
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#73DFFF]/55 bg-[#101A38]/72 px-6 text-base font-black text-[#DDFBFF] transition hover:-translate-y-0.5 hover:border-[#FFB15D] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-[#73DFFF]/20 disabled:text-[#D4F5FF]/45 disabled:hover:translate-y-0"
    >
      {children}
    </button>
  );
}

function KioskArtwork({
  place,
  generatedImage,
  guideText
}: {
  place: PlaceChoice;
  generatedImage?: string;
  guideText: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-6 z-0 overflow-hidden rounded-[24px] border border-[#73DFFF]/20 bg-[#0B1230] shadow-[inset_0_0_60px_rgba(0,0,0,0.45)]">
      {generatedImage ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ backgroundImage: `url(${generatedImage})`, backgroundPosition: "center", backgroundSize: "cover" }}
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          style={{ backgroundImage: "url('/images/story-default-bg.png')", backgroundPosition: "center", backgroundSize: "cover" }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090D20]/50 via-transparent to-[#090D20]/10" />
      {guideText ? (
        <div className="absolute bottom-16 left-7 flex max-w-[calc(100%-56px)] items-end gap-3">
          <img
            src="/images/mori-mascot-transparent.png"
            alt=""
            aria-hidden="true"
            className="story-mascot-float h-28 w-28 shrink-0 object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.3)] sm:h-32 sm:w-32"
            draggable={false}
          />
          <div className="relative mb-7 max-w-[360px] rounded-2xl border-2 border-[#FFB15D]/75 bg-white px-5 py-4 text-left text-base font-black leading-snug text-[#24304B] shadow-[0_14px_28px_rgba(0,0,0,0.24)]">
            <span className="absolute -left-3 bottom-5 h-5 w-5 rotate-45 border-b-2 border-l-2 border-[#FFB15D]/75 bg-white" />
            {guideText}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniPlaceArt({ place }: { place: PlaceChoice }) {
  const scene = place.sceneKey;

  return (
    <span className="relative mb-2 block h-16 overflow-hidden rounded-xl border border-[#73DFFF]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_22px_rgba(0,0,0,0.22)]">
      <span
        className="absolute inset-0"
        style={{
          background:
            scene === "sea"
              ? "radial-gradient(circle at 80% 18%,#FFF2A2,transparent 16%),linear-gradient(180deg,#69E7FF 0%,#229BE4 48%,#074178 100%)"
              : scene === "cloud"
                ? "radial-gradient(circle at 75% 18%,#FFF1B8,transparent 18%),linear-gradient(180deg,#AFC4FF 0%,#F2FBFF 52%,#8C9EF1 100%)"
                : `radial-gradient(circle at 78% 16%, #FFF0A8, transparent 18%), radial-gradient(circle at 18% 18%, rgba(255,255,255,0.58), transparent 18%), linear-gradient(135deg, ${place.color}, #244066 66%, #111A39)`
        }}
      />
      {scene === "village" ? (
        <>
          <span className="absolute inset-x-0 bottom-0 h-7 rounded-t-[55%] bg-[linear-gradient(180deg,#99D982,#4FAE67)]" />
          <span className="absolute bottom-4 left-5 h-8 w-10 rounded-t-2xl rounded-b-md bg-[linear-gradient(145deg,#FFE1A5,#E99C58)] shadow-[inset_-4px_-5px_8px_rgba(122,60,34,0.18),0_6px_10px_rgba(0,0,0,0.18)]" />
          <span className="absolute bottom-11 left-3 h-0 w-0 border-x-[26px] border-b-[24px] border-x-transparent border-b-[#E56F47] drop-shadow-[0_4px_3px_rgba(0,0,0,0.2)]" />
          <span className="absolute bottom-4 left-20 h-9 w-9 rounded-t-2xl rounded-b-md bg-[linear-gradient(145deg,#FFF0B7,#F4B96A)] shadow-[inset_-4px_-5px_8px_rgba(122,60,34,0.18),0_6px_10px_rgba(0,0,0,0.18)]" />
          <span className="absolute bottom-[52px] left-[70px] h-0 w-0 border-x-[26px] border-b-[27px] border-x-transparent border-b-[#F07D4D] drop-shadow-[0_4px_3px_rgba(0,0,0,0.2)]" />
          <span className="absolute bottom-5 right-7 h-5 w-9 rounded-full bg-[#FFE07A]/85 blur-[1px]" />
        </>
      ) : null}
      {scene === "forest" ? (
        <>
          <span className="absolute inset-x-0 bottom-0 h-6 rounded-t-[60%] bg-[linear-gradient(180deg,#67C978,#2D7545)]" />
          {[18, 48, 82, 118].map((left) => (
            <span key={left} className="absolute bottom-4 h-12 w-9 rounded-t-full bg-[linear-gradient(145deg,#82E6A2,#2FAE66)] shadow-[inset_-5px_-7px_9px_rgba(9,80,45,0.22),0_7px_10px_rgba(0,0,0,0.18)]" style={{ left }} />
          ))}
          <span className="absolute bottom-3 right-8 h-10 w-11 rounded-t-full bg-[linear-gradient(145deg,#FFB19E,#F16F5D)] shadow-[inset_-5px_-6px_8px_rgba(129,40,38,0.2)]" />
        </>
      ) : null}
      {scene === "island" ? (
        <>
          <span className="absolute inset-x-0 bottom-0 h-7 bg-[linear-gradient(180deg,#2BAFE4,#1267A9)]" />
          <span className="absolute bottom-5 left-8 h-7 w-24 rounded-[50%] bg-[linear-gradient(145deg,#FFE98C,#F6BB4B)] shadow-[0_7px_12px_rgba(0,0,0,0.2)]" />
          <span className="absolute bottom-10 left-16 h-11 w-3 rounded-full bg-[linear-gradient(90deg,#A96A37,#71411F)]" />
          <span className="absolute bottom-[68px] left-14 h-8 w-16 -rotate-12 rounded-[50%] bg-[linear-gradient(145deg,#74DE8E,#35A95A)] shadow-[inset_-5px_-5px_8px_rgba(22,92,45,0.22)]" />
          <span className="absolute bottom-[60px] left-8 h-7 w-14 rotate-12 rounded-[50%] bg-[linear-gradient(145deg,#8AF0A5,#40BA66)]" />
        </>
      ) : null}
      {scene === "sea" ? (
        <>
          <span className="absolute left-0 top-6 h-3 w-full bg-[linear-gradient(90deg,transparent,#B9F7FF,transparent,#B9F7FF,transparent)] opacity-70" />
          <span className="absolute bottom-3 left-8 h-7 w-12 rounded-[50%] bg-[linear-gradient(145deg,#FFC06C,#F6903D)] shadow-[inset_-5px_-5px_8px_rgba(127,62,22,0.2),0_6px_10px_rgba(0,0,0,0.18)]" />
          <span className="absolute bottom-4 left-[70px] h-0 w-0 border-y-[8px] border-r-[14px] border-y-transparent border-r-[#FFB15D]" />
          <span className="absolute bottom-2 right-8 h-11 w-5 rounded-t-full bg-[linear-gradient(145deg,#8DFFE0,#35C89F)]" />
          <span className="absolute bottom-2 right-14 h-8 w-4 rounded-t-full bg-[linear-gradient(145deg,#B7FFD0,#6DD98A)]" />
        </>
      ) : null}
      {scene === "cloud" ? (
        <>
          <span className="absolute bottom-3 left-4 h-8 w-20 rounded-full bg-[linear-gradient(145deg,#FFFFFF,#DDEBFF)] shadow-[inset_-5px_-6px_9px_rgba(102,128,180,0.2)]" />
          <span className="absolute bottom-6 left-12 h-9 w-14 rounded-full bg-[linear-gradient(145deg,#FFFFFF,#E3EEFF)]" />
          <span className="absolute bottom-10 right-10 h-10 w-9 rounded-t-lg bg-[linear-gradient(145deg,#FFE89C,#F0B854)] shadow-[inset_-4px_-5px_8px_rgba(128,82,22,0.18)]" />
          <span className="absolute bottom-20 right-8 h-0 w-0 border-x-[22px] border-b-[22px] border-x-transparent border-b-[#F0A34D]" />
          <span className="absolute bottom-5 right-4 h-7 w-16 rounded-full bg-white/90" />
        </>
      ) : null}
      {scene === "baekma" ? (
        <>
          <span className="absolute inset-x-0 bottom-0 h-8 bg-[linear-gradient(180deg,#59CFD2,#218A9C)]" />
          <span className="absolute bottom-5 left-0 h-3 w-full bg-[linear-gradient(90deg,transparent,#D9FFFF,transparent,#D9FFFF,transparent)] opacity-70" />
          <span className="absolute bottom-8 left-5 h-8 w-24 rounded-t-[50%] bg-[linear-gradient(145deg,#84D47C,#4FA55F)] shadow-[0_6px_10px_rgba(0,0,0,0.16)]" />
          <span className="absolute bottom-12 right-8 h-12 w-16 rounded-t-full bg-[linear-gradient(145deg,#D0A372,#8C633C)] shadow-[inset_-6px_-6px_10px_rgba(66,36,18,0.2)]" />
        </>
      ) : null}
      {scene === "gungnamji" ? (
        <>
          <span className="absolute inset-x-0 bottom-0 h-8 bg-[linear-gradient(180deg,#61C6C0,#2E8D96)]" />
          <span className="absolute bottom-4 left-8 h-4 w-16 rounded-[50%] bg-[linear-gradient(145deg,#8DE48B,#55B96A)]" />
          <span className="absolute bottom-8 left-16 h-8 w-8 rounded-full bg-[linear-gradient(145deg,#FFC0D5,#FF7EA8)] shadow-[0_5px_8px_rgba(0,0,0,0.16)]" />
          <span className="absolute bottom-6 right-12 h-5 w-14 rounded-[50%] bg-[linear-gradient(145deg,#A0E99A,#68C777)]" />
          <span className="absolute bottom-11 right-[70px] h-6 w-6 rounded-full bg-[linear-gradient(145deg,#FFE0EA,#FFA6C1)]" />
        </>
      ) : null}
      <span className="absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.42),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.2),transparent_42%,rgba(0,0,0,0.2))]" />
    </span>
  );
}

function fallbackSceneImage(images: Record<number, string>, pageIndex: number) {
  for (let index = pageIndex - 1; index >= 0; index -= 1) {
    if (images[index]) return images[index];
  }

  for (let index = pageIndex + 1; index < 6; index += 1) {
    if (images[index]) return images[index];
  }

  return undefined;
}

function StoryTextPanel({
  story,
  pageIndex,
  imageReady,
  onPrev,
  onNext
}: {
  story: StoryResult;
  pageIndex: number;
  imageReady: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <article
        key={`text-${pageIndex}`}
        className="animate-[pageIn_360ms_ease-out] flex min-h-[360px] flex-1 flex-col justify-center rounded-[24px] border-2 border-[#FFB15D]/45 bg-[#FFFDF7] p-8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_0_20px_rgba(255,177,93,0.16)]"
      >
        <p className="mb-5 text-base font-black text-[#A16B32]">{pageIndex + 1} / {story.pages.length}쪽</p>
        <p className="text-3xl font-bold leading-[1.85] text-[#312D29]">{story.pages[pageIndex]}</p>
      </article>
      <div className="grid grid-cols-2 gap-3">
        <SecondaryButton onClick={onPrev}>
          <ArrowLeftIcon className="h-5 w-5" /> 이전 쪽
        </SecondaryButton>
        <SecondaryButton onClick={onNext}>
          다음 쪽 <ArrowRightIcon className="h-5 w-5" />
        </SecondaryButton>
      </div>
      {!imageReady ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#73DFFF]/25 bg-[#101A38]/72 py-3 text-sm font-black text-[#D4F5FF]">
          <SparklesIcon className="h-4 w-4 animate-pulse" /> 이미지 생성 중...
        </div>
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPrintableStoryHtml({
  title,
  place,
  pages,
  images
}: {
  title: string;
  place: string;
  pages: string[];
  images: Record<number, string>;
}) {
  const coverImage = `${window.location.origin}/images/story-default-bg.png`;
  const safeTitle = escapeHtml(title);
  const safePlace = escapeHtml(place);
  const body = pages
    .map((page, index) => {
      const image = images[index] || fallbackSceneImage(images, index) || coverImage;
      return `
        <section class="page">
          <figure class="image">
            <img src="${image}" alt="" />
          </figure>
          <div class="story">
            <p class="count">${index + 1} / ${pages.length}쪽</p>
            <p>${escapeHtml(page)}</p>
          </div>
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f6ead6; color: #2f2923; font-family: Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; }
    .cover { height: 100vh; display: grid; place-items: center; padding: 36px; text-align: center; background: linear-gradient(135deg, #101a38, #1a244c); color: white; page-break-after: always; break-after: page; }
    .cover h1 { margin: 0 0 18px; font-size: 46px; }
    .cover p { margin: 0; font-size: 22px; font-weight: 800; color: #dff9ff; }
    .page { height: 100vh; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding: 22px; page-break-after: always; break-after: page; overflow: hidden; }
    .image { margin: 0; width: 100%; height: 100%; min-height: 0; overflow: hidden; border-radius: 22px; box-shadow: 0 14px 34px rgba(45, 35, 25, 0.18); background: #eef4f7; }
    .image img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .story { min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: center; border-radius: 22px; background: #fffdf7; padding: 34px; border: 2px solid #e7c884; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.8); overflow: hidden; }
    .count { margin: 0 0 18px; color: #a16b32; font-size: 16px; font-weight: 900; }
    .story p:last-child { margin: 0; font-size: clamp(20px, 2.2vw, 28px); line-height: 1.72; font-weight: 800; word-break: keep-all; overflow-wrap: break-word; }
    @media print {
      body { background: white; }
      .cover, .page { height: calc(100vh - 1px); break-after: page; }
      .page { grid-template-columns: 1fr 1fr; padding: 0; gap: 10mm; }
      .image { width: 100%; height: 100%; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .story { padding: 12mm; }
      .story p:last-child { font-size: 22pt; line-height: 1.65; }
    }
  </style>
  <script>
    async function waitForImages() {
      const images = Array.from(document.images);
      await Promise.all(images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      }));
    }
    window.__printWhenReady = async function () {
      await waitForImages();
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.focus();
      window.print();
    };
    window.addEventListener("afterprint", () => {
      if (window.opener && !window.opener.closed) window.opener.focus();
      window.close();
    });
  </script>
</head>
<body>
  <section class="cover">
    <div>
      <h1>${safeTitle}</h1>
      <p>${safePlace}</p>
    </div>
  </section>
  ${body}
</body>
</html>`;
}

function dataUrlToObjectUrl(dataUrl: string) {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const [header, payload] = dataUrl.split(",");
  const mimeType = header.match(/^data:([^;]+)/)?.[1] || "image/png";
  const binary = window.atob(payload || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export function StoryKioskApp() {
  const [step, setStep] = useState<Step>("login");
  const [classIdInput, setClassIdInput] = useState("");
  const [classId, setClassId] = useState("");
  const [classLoginMessage, setClassLoginMessage] = useState("");
  const [character, setCharacter] = useState<CharacterChoice>(defaultCharacter);
  const [trait, setTrait] = useState<Choice>(defaultTrait);
  const [place, setPlace] = useState<PlaceChoice>(defaultPlace);
  const [events, setEvents] = useState<StorySelection["events"]>({
    opening: eventGroups.opening[0],
    development: eventGroups.development[0],
    climax: eventGroups.climax[0],
    ending: eventGroups.ending[0]
  });
  const [story, setStory] = useState<StoryResult>(() => localStory(buildSelection(defaultCharacter, defaultTrait, defaultPlace, {
    opening: eventGroups.opening[0],
    development: eventGroups.development[0],
    climax: eventGroups.climax[0],
    ending: eventGroups.ending[0]
  })));
  const [pageIndex, setPageIndex] = useState(0);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof checkProxyHealth>>>(null);
  const [sceneImages, setSceneImages] = useState<Record<number, string>>({});
  const [imageGenerationMode, setImageGenerationMode] = useState<ImageGenerationMode>(null);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [activeSavedStoryId, setActiveSavedStoryId] = useState<string | null>(null);
  const [customTrait, setCustomTrait] = useState("");
  const [customEvents, setCustomEvents] = useState<Record<keyof StorySelection["events"], string>>({
    opening: "",
    development: "",
    climax: "",
    ending: ""
  });
  const [customError, setCustomError] = useState("");
  const [musicState, setMusicState] = useState<StoryMusicState>("paused");
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<number | null>(null);
  // 자동 생성 대상 4장면: 시작, 발단, 절정, 결말
  const IMAGE_PAGES = [0, 1, 3, 5] as const;

  const selection = useMemo(() => buildSelection(character, trait, place, events), [character, trait, place, events]);
  const pdfMetadata = useMemo(
    () => buildStoryPdfMetadata({ classId: classId || "mosan-demo", characterName: character.name, createdAt: new Date() }),
    [character.name, classId]
  );
  const currentStepIndex = stepOrder.indexOf(step);
  const currentSceneImage = step === "result" ? sceneImages[pageIndex] || fallbackSceneImage(sceneImages, pageIndex) : undefined;
  const mascotGuide = useMemo(() => mascotGuideForStep(step, character.name), [character.name, step]);
  const printableImagesReady = IMAGE_PAGES.every((index) => Boolean(sceneImages[index]));
  const currentPageImageLoading = Boolean(imageGenerationMode && IMAGE_PAGES.includes(pageIndex as typeof IMAGE_PAGES[number]) && !sceneImages[pageIndex]);

  const persistSavedStories = useCallback((updater: (current: SavedStory[]) => SavedStory[]) => {
    setSavedStories((current) => {
      const next = updater(current).slice(0, maxSavedStories);
      writeSavedStories(next);
      return next;
    });
  }, []);

  const persistActiveStoryImages = useCallback((images: Record<number, string>) => {
    if (!activeSavedStoryId) return;

    persistSavedStories((current) =>
      current.map((item) => (item.id === activeSavedStoryId ? { ...item, sceneImages: images } : item))
    );
  }, [activeSavedStoryId, persistSavedStories]);

  const stopStoryMusic = useCallback(() => {
    if (musicIntervalRef.current) {
      window.clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }

    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  const playMusicNote = useCallback((frequency: number) => {
    const context = audioContextRef.current;
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.78);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.82);
  }, []);

  const startStoryMusic = useCallback(() => {
    const AudioContextConstructor =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    stopStoryMusic();
    audioContextRef.current = new AudioContextConstructor();
    const notes = [392, 494, 587, 659, 587, 494];
    let index = 0;
    playMusicNote(notes[index]);
    musicIntervalRef.current = window.setInterval(() => {
      index = (index + 1) % notes.length;
      playMusicNote(notes[index]);
    }, 900);
  }, [playMusicNote, stopStoryMusic]);

  function toggleStoryMusic() {
    const nextState = nextMusicState(musicState);
    setMusicState(nextState);
    if (nextState === "playing") {
      startStoryMusic();
    } else {
      stopStoryMusic();
    }
  }

  const reset = useCallback(() => {
    stopStoryMusic();
    setMusicState("paused");
    setStep("attract");
    setPageIndex(0);
  }, [stopStoryMusic]);

  function enterClassSession() {
    const normalized = normalizeClassId(classIdInput);
    if (!/^mosan-\d{3}$/.test(normalized)) {
      setClassLoginMessage("아이디는 예: mosan-001 처럼 입력해 주세요.");
      return;
    }

    writeClassSession(normalized);
    setClassId(normalized);
    setClassIdInput(normalized);
    setClassLoginMessage("좋아요. 이제 나만의 동화책을 만들어요.");
    setStep("attract");
  }

  function openSavedStory(savedStory: SavedStory) {
    setCharacter(savedStory.character);
    setTrait(savedStory.trait);
    setPlace(savedStory.place);
    setEvents(savedStory.events);
    setStory(savedStory.story);
    setSceneImages(savedStory.sceneImages || {});
    setActiveSavedStoryId(savedStory.id);
    setPageIndex(0);
    setStep("result");
  }

  useEffect(() => {
    checkProxyHealth().then(setHealth);
    setSavedStories(readSavedStories());
    const session = readClassSession();
    if (session) {
      setClassId(session.classId);
      setClassIdInput(session.classId);
      setStep("attract");
    }
  }, []);

  useEffect(() => {
    if (step === "login" || step === "attract") return undefined;

    const eventsToWatch = ["pointerdown", "keydown", "touchstart"];
    let timeout = window.setTimeout(reset, 90000);
    const refresh = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(reset, 90000);
    };

    eventsToWatch.forEach((eventName) => window.addEventListener(eventName, refresh));
    return () => {
      window.clearTimeout(timeout);
      eventsToWatch.forEach((eventName) => window.removeEventListener(eventName, refresh));
    };
  }, [reset, step]);

  useEffect(() => {
    if (step === "result") return undefined;

    stopStoryMusic();
    setMusicState("paused");
    return undefined;
  }, [step, stopStoryMusic]);

  async function createStory() {
    const storySelection = selection;
    const storyId = `story-${Date.now()}`;
    setStep("loading");
    setPageIndex(0);
    setSceneImages({});
    setImageGenerationMode(null);
    const result = await generateStory(storySelection);
    setStory(result);
    setActiveSavedStoryId(storyId);
    persistSavedStories((current) => [
      {
        id: storyId,
        createdAt: new Date().toISOString(),
        character,
        trait,
        place,
        events,
        story: result,
        sceneImages: {}
      },
      ...current.filter((item) => item.id !== storyId)
    ]);
    setStep("result");
  }

  async function generateStoryImages(indices: readonly number[], mode: Exclude<ImageGenerationMode, null>) {
    if (imageGenerationMode) return sceneImages;

    setImageGenerationMode(mode);
    let nextImages = { ...sceneImages };

    try {
      for (const index of indices) {
        if (nextImages[index]) continue;

        const scene = story.pages[index];
        if (!scene) continue;

        const image = await generateSceneImage(selection, scene, index);
        if (image) {
          nextImages = { ...nextImages, [index]: image.imageDataUrl };
          setSceneImages(nextImages);
          persistActiveStoryImages(nextImages);
        }
      }

      return nextImages;
    } finally {
      setImageGenerationMode(null);
    }
  }

  async function generateCoverImage() {
    await generateStoryImages([0], "cover");
  }

  async function generatePrintableImages() {
    return generateStoryImages(IMAGE_PAGES, "print");
  }
  function getPrintableHtml(images: Record<number, string> = sceneImages) {
    return buildPrintableStoryHtml({
      title: pdfMetadata.title,
      place: `${pdfMetadata.schoolLabel} · ${place.name} · ${classId || "연습 아이디"}`,
      pages: story.pages,
      images
    });
  }

  function downloadStorybook() {
    const html = getPrintableHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = pdfMetadata.filename.replace(".pdf", ".html");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function printStorybook() {
    const imagesForPrint = printableImagesReady ? sceneImages : await generatePrintableImages();
    const objectUrls: string[] = [];
    const printImages = Object.fromEntries(
      Object.entries(imagesForPrint).map(([key, value]) => {
        const objectUrl = dataUrlToObjectUrl(value);
        if (objectUrl.startsWith("blob:")) objectUrls.push(objectUrl);
        return [key, objectUrl];
      })
    ) as Record<number, string>;
    const html = buildPrintableStoryHtml({
      title: pdfMetadata.title,
      place: `${pdfMetadata.schoolLabel} · ${place.name} · ${classId || "연습 아이디"}`,
      pages: story.pages,
      images: printImages
    });
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      window.setTimeout(() => {
        const readyPrint = (printWindow as Window & { __printWhenReady?: () => void }).__printWhenReady;
        if (typeof readyPrint === "function") {
          readyPrint();
        } else {
          printWindow.focus();
          printWindow.print();
        }
      }, 1400);
      window.setTimeout(() => objectUrls.forEach((url) => URL.revokeObjectURL(url)), 120000);
    } else {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    }
  }

  function move(delta: number) {
    const next = stepOrder[currentStepIndex + delta];
    if (next) setStep(next);
  }

  function updateEvent(key: keyof StorySelection["events"], value: Choice) {
    setEvents((current) => ({ ...current, [key]: value }));
  }

  function applyCustomTrait() {
    const label = sanitizeCustomChoice(customTrait);
    if (!label) return;
    if (isBlockedCustomChoice(label)) {
      setCustomError("다른 표현으로 써 주세요.");
      return;
    }

    setTrait({ id: `custom-trait-${Date.now()}`, label });
    setCustomTrait("");
    setCustomError("");
  }

  function applyCustomEvent(key: keyof StorySelection["events"]) {
    const label = sanitizeCustomChoice(customEvents[key]);
    if (!label) return;
    if (isBlockedCustomChoice(label)) {
      setCustomError("다른 표현으로 써 주세요.");
      return;
    }

    updateEvent(key, { id: `custom-${key}-${Date.now()}`, label });
    setCustomEvents((current) => ({ ...current, [key]: "" }));
    setCustomError("");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#090D20] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,126,72,0.24),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(45,107,255,0.24),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(125,232,255,0.16),transparent_45%),linear-gradient(180deg,#151936_0%,#090D20_100%)]" />
      <div className="pointer-events-none fixed inset-6 rounded-[34px] border-4 border-[#244DFF] shadow-[inset_0_0_0_3px_rgba(255,177,93,0.85),0_0_34px_rgba(36,77,255,0.42)]" />

      <section className={["relative grid min-h-screen p-6 sm:p-8 lg:p-12", step === "login" || step === "attract" ? "grid-rows-1" : "grid-rows-[auto_1fr]"].join(" ")}>
        {step !== "login" && step !== "attract" ? (
          <header className="z-10 mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/images/mori-mascot-transparent.png"
                alt=""
                aria-hidden="true"
                className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.28)]"
                draggable={false}
              />
              <div>
                <h1 className="mt-1 text-2xl font-black text-white drop-shadow-[0_0_16px_rgba(125,232,255,0.32)] sm:text-3xl">
                  AI와 함께 만드는 나만의 동화책
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {step !== "loading" && step !== "result" ? <Progress activeStep={step} /> : null}
              {classId ? (
                <div className="rounded-full border border-[#FFB15D]/45 bg-[#2E2442]/82 px-4 py-2 text-sm font-black text-[#FFE9B0]">
                  {classId}
                </div>
              ) : null}
              <StatusPill health={health} />
            </div>
          </header>
        ) : null}

        {step === "login" ? (
          <div className="z-10 grid min-h-0 place-items-center px-3 py-5 text-center">
            <div className="grid w-full max-w-[980px] gap-6 rounded-[34px] border-2 border-[#73DFFF]/35 bg-[#101A38]/82 px-6 py-8 shadow-[0_0_42px_rgba(36,77,255,0.28)] backdrop-blur sm:px-10">
              <div className="grid gap-3">
                <h1 className="text-[clamp(42px,6vw,86px)] font-black leading-tight text-white drop-shadow-[0_0_28px_rgba(125,232,255,0.35)]">
                  AI와 함께 나만의 동화책 만들기
                </h1>
                <p className="mx-auto max-w-[720px] text-[clamp(18px,2vw,26px)] font-bold leading-relaxed text-[#D4F5FF]">
                  주인공을 고르고, 사건을 이어 붙이면 세상에 하나뿐인 6쪽 동화책이 완성돼요.
                </p>
              </div>

              <div className="mx-auto grid w-full max-w-[560px] gap-3 rounded-[24px] border border-[#FFB15D]/45 bg-[#0B1029]/80 p-4 text-left">
                <label className="text-base font-black text-[#FFE9B0]" htmlFor="class-id">
                  선생님이 알려준 수업 아이디
                </label>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <input
                    id="class-id"
                    value={classIdInput}
                    onChange={(event) => setClassIdInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") enterClassSession();
                    }}
                    placeholder="예: mosan-001"
                    className="min-h-16 min-w-0 rounded-2xl border-2 border-[#73DFFF]/30 bg-[#151F41] px-5 text-xl font-black text-white outline-none placeholder:text-[#D4F5FF]/45 focus:border-[#FFB15D]"
                  />
                  <button
                    type="button"
                    onClick={enterClassSession}
                    className="min-h-16 rounded-2xl border-2 border-[#FFB15D] bg-[#F0633C] px-6 text-lg font-black text-white shadow-[0_0_24px_rgba(240,99,60,0.26)] active:scale-[0.98]"
                  >
                    시작
                  </button>
                </div>
                <p className="min-h-6 text-sm font-black text-[#FFD073]">
                  {classLoginMessage || "아이디를 입력하면 동화 만들기 화면으로 들어가요."}
                </p>
              </div>
            </div>
          </div>
        ) : step === "attract" ? (
          <div className="z-10 grid min-h-0 gap-5">
          <button
            type="button"
            onClick={() => setStep("character")}
            className="z-10 grid min-h-0 place-items-center px-3 py-5 text-center focus:outline-none"
            aria-label="동화 만들기 시작"
          >
            <span className="relative flex w-full max-w-[1120px] flex-col items-center justify-center gap-3 rounded-[34px] px-6 py-6 sm:px-10 lg:min-h-[calc(100vh-96px)]">
              <span className="pointer-events-none absolute left-[8%] top-[14%] h-20 w-20 rounded-full border border-[#7DFFD4]/25" />
              <span className="pointer-events-none absolute right-[10%] top-[20%] h-28 w-28 rounded-full border border-[#FFB15D]/25" />
              <span className="pointer-events-none absolute bottom-[12%] left-[18%] h-3 w-3 rotate-45 bg-[#FFE17A] shadow-[0_0_20px_rgba(255,225,122,0.7)]" />
              <span className="pointer-events-none absolute bottom-[22%] right-[20%] h-4 w-4 rotate-45 bg-[#7DFFD4] shadow-[0_0_22px_rgba(125,255,212,0.68)]" />

              <span className="flex flex-col items-center gap-2">
                <span className="text-[clamp(26px,3.4vw,52px)] font-black leading-tight text-white drop-shadow-[0_0_20px_rgba(125,232,255,0.28)]">
                  AI와 함께 만드는 나만의 동화책
                </span>
              </span>

              <span className="mt-1 text-[clamp(58px,8.4vw,112px)] font-black leading-none text-white drop-shadow-[0_0_38px_rgba(125,232,255,0.36)]">
                동화 만들기
              </span>

              <span aria-hidden="true" className="story-mascot-float relative mt-1 block h-[clamp(130px,16vw,210px)] w-[clamp(130px,16vw,210px)]">
                <span className="absolute inset-x-[18%] bottom-1 h-8 rounded-full bg-[#050914]/55 blur-xl" />
                <img
                  src="/images/mori-mascot-transparent.png"
                  alt=""
                  className="relative h-full w-full object-contain drop-shadow-[0_24px_34px_rgba(0,0,0,0.36)]"
                  draggable={false}
                />
              </span>

              <span className="relative rounded-[22px] border border-[#FFB15D]/70 bg-white px-7 py-4 text-[clamp(17px,1.8vw,24px)] font-black text-[#15203C] shadow-[0_16px_34px_rgba(0,0,0,0.24)]">
                화면을 눌러 나만의 동화를 시작해요!
              </span>

            </span>
          </button>
          {savedStories.length > 0 ? (
            <div className="mx-auto w-full max-w-[1120px] rounded-[24px] border border-[#73DFFF]/25 bg-[#101A38]/82 p-4 shadow-[0_0_24px_rgba(36,77,255,0.18)]">
              <div className="mb-3 flex items-center gap-2 text-base font-black text-[#D4F5FF]">
                <ClockIcon className="h-5 w-5 text-[#7DFFD4]" />
                최근 만든 동화
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {savedStories.slice(0, 4).map((savedStory) => (
                  <button
                    key={savedStory.id}
                    type="button"
                    onClick={() => openSavedStory(savedStory)}
                    className="min-h-20 rounded-2xl border border-[#73DFFF]/25 bg-[#151F41] px-4 py-3 text-left text-white transition hover:border-[#FFB15D] active:scale-[0.98]"
                  >
                    <span className="block text-sm font-black text-[#7DFFD4]">{formatSavedStoryDate(savedStory.createdAt)}</span>
                    <span className="mt-1 block truncate text-lg font-black">{savedStory.character.name}</span>
                    <span className="mt-1 block truncate text-xs font-bold text-[#D4F5FF]">{savedStory.place.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          </div>
        ) : (
        <>
        <div className="z-10 mx-auto grid min-h-0 w-full max-w-[1320px] grid-cols-1 gap-6 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:items-center">
          <div className="relative min-h-[360px] max-h-[calc(100vh-148px)] overflow-hidden rounded-[30px] border-2 border-[#FFB15D]/80 bg-[#111936]/78 shadow-[0_0_36px_rgba(45,107,255,0.28)] lg:min-h-[620px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(125,232,255,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))]" />
            <KioskArtwork place={place} generatedImage={currentSceneImage} guideText={mascotGuide} />
            {step === "result" ? (
              <div className="pointer-events-none absolute inset-x-6 bottom-5 z-20 rounded-2xl border border-[#73DFFF]/30 bg-[#080D1F]/72 p-4 text-center font-black text-[#E8FCFF] shadow-[0_0_18px_rgba(125,232,255,0.18)] backdrop-blur">
                {pageIndex + 1} / {story.pages.length}쪽
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[520px] max-h-[calc(100vh-148px)] flex-col justify-center overflow-hidden rounded-[30px] border-2 border-[#244DFF]/75 bg-[#101A38]/78 p-5 shadow-[0_0_34px_rgba(36,77,255,0.26)] backdrop-blur lg:min-h-[620px] lg:p-6">
            {step === "character" ? (
              <div className="space-y-6">
                <div>
                  <p className="text-base font-black text-[#7DFFD4]">1단계</p>
                  <h2 className="text-3xl font-black">주인공을 골라 주세요</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {characters.map((item) => (
                    <button key={item.id} type="button" onClick={() => setCharacter(item)} className={choiceButtonClass(character.id === item.id)}>
                      <span className="mb-3 block h-4 w-16 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xl font-black">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === "trait" ? (
              <div className="space-y-6">
                <div>
                  <p className="text-base font-black text-[#7DFFD4]">2단계</p>
                  <h2 className="text-3xl font-black">{character.name}의 성격은?</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {traits.map((item) => (
                    <button key={item.id} type="button" onClick={() => setTrait(item)} className={choiceButtonClass(trait.id === item.id)}>
                      <span className="flex items-center justify-between gap-3 text-xl font-black">
                        {item.label}
                        {trait.id === item.id ? <CheckIcon className="h-6 w-6 text-[#1F8A74]" /> : null}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-[#73DFFF]/20 bg-[#0B1029]/72 p-3">
                  <p className="mb-2 text-sm font-black text-[#D4F5FF]">직접 입력</p>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      value={customTrait}
                      onChange={(event) => setCustomTrait(sanitizeCustomChoice(event.target.value))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") applyCustomTrait();
                      }}
                      maxLength={24}
                      placeholder="예: 상상력이 풍부한"
                      className="min-h-12 rounded-xl border border-[#73DFFF]/25 bg-[#151F41] px-4 text-base font-black text-white outline-none placeholder:text-[#D4F5FF]/45 focus:border-[#FFB15D]"
                    />
                    <button
                      type="button"
                      onClick={applyCustomTrait}
                      className="min-h-12 rounded-xl border border-[#FFB15D] bg-[#F0633C] px-4 text-sm font-black text-white active:scale-[0.98]"
                    >
                      추가
                    </button>
                  </div>
                  {customError ? <p className="mt-2 text-sm font-black text-[#FFD073]">{customError}</p> : null}
                </div>
              </div>
            ) : null}

            {step === "place" ? (
              <div className="space-y-4">
                <div>
                  <p className="text-base font-black text-[#7DFFD4]">3단계</p>
                  <h2 className="text-3xl font-black">이야기 배경을 골라요</h2>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {places.map((item) => (
                    <button key={item.id} type="button" onClick={() => setPlace(item)} className={compactChoiceButtonClass(place.id === item.id)}>
                      <MiniPlaceArt place={item} />
                      <span className="text-sm font-black sm:text-base">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === "events" ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-black text-[#7DFFD4]">4단계</p>
                  <h2 className="text-3xl font-black">기승전결을 완성해요</h2>
                </div>
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                  {[
                    ["opening", "발단", eventGroups.opening],
                    ["development", "전개", eventGroups.development],
                    ["climax", "절정", eventGroups.climax],
                    ["ending", "결말", eventGroups.ending]
                  ].map(([key, title, list]) => (
                    <div key={key as string} className="rounded-2xl border border-[#73DFFF]/20 bg-[#0B1029]/72 p-2">
                      <p className="mb-1 text-xs font-black text-[#D4F5FF]">{title as string}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(list as Choice[]).map((item) => {
                          const eventKey = key as keyof StorySelection["events"];
                          const active = events[eventKey].id === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => updateEvent(eventKey, item)}
                              className={[
                                "min-h-8 rounded-xl border px-2.5 py-1 text-left text-[10px] font-black leading-snug transition active:scale-[0.98]",
                                active ? "border-[#FFB15D] bg-[#2E2442] text-white" : "border-[#73DFFF]/25 bg-[#151F41] text-[#D4F5FF]"
                              ].join(" ")}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 grid grid-cols-[1fr_auto] gap-1.5">
                        <input
                          value={customEvents[key as keyof StorySelection["events"]]}
                          onChange={(event) => {
                            const eventKey = key as keyof StorySelection["events"];
                            const value = sanitizeCustomChoice(event.target.value);
                            setCustomEvents((current) => ({ ...current, [eventKey]: value }));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") applyCustomEvent(key as keyof StorySelection["events"]);
                          }}
                          maxLength={24}
                          placeholder={`${title as string} 직접 쓰기`}
                          className="min-h-8 rounded-xl border border-[#73DFFF]/25 bg-[#151F41] px-2.5 text-[10px] font-black text-white outline-none placeholder:text-[#D4F5FF]/45 focus:border-[#FFB15D]"
                        />
                        <button
                          type="button"
                          onClick={() => applyCustomEvent(key as keyof StorySelection["events"])}
                          className="min-h-8 rounded-xl border border-[#FFB15D] bg-[#F0633C] px-2.5 text-[10px] font-black text-white active:scale-[0.98]"
                        >
                          추가
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {customError ? <p className="text-sm font-black text-[#FFD073]">{customError}</p> : null}
              </div>
            ) : null}

            {step === "loading" ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto h-20 w-20 animate-spin rounded-full border-8 border-[#F2B33D]/30 border-t-[#1F8A74]" />
                <h2 className="text-4xl font-black">동화를 짓는 중...</h2>
                <p className="text-xl font-bold leading-8 text-[#D4F5FF]">
                  연결이 느려도 괜찮아요. 필요하면 내장 엔진이 바로 동화를 완성해요.
                </p>
              </div>
            ) : null}

            {step === "result" ? (
              <div className="flex h-full flex-col gap-5">
                <div>
                  <p className="text-base font-black text-[#7DFFD4]">
                    {story.source === "ai" ? "AI가 새로 지은 동화" : "내장 엔진 동화"}
                  </p>
                  <h2 className="text-3xl font-black">{pdfMetadata.title}</h2>
                  <p className="mt-1 text-sm font-black text-[#D4F5FF]">{classId || "연습 아이디"} · {place.name}</p>
                </div>
                <StoryTextPanel
                  story={story}
                  pageIndex={pageIndex}
                  imageReady={!currentPageImageLoading}
                  onPrev={() => setPageIndex((current) => Math.max(0, current - 1))}
                  onNext={() => setPageIndex((current) => Math.min(story.pages.length - 1, current + 1))}
                />
                <div className="rounded-2xl border border-[#FFB15D]/30 bg-[#2E2442]/72 p-3">
                  <SecondaryButton onClick={toggleStoryMusic}>
                    <MusicalNoteIcon className="h-5 w-5" /> {musicState === "playing" ? "배경음악 끄기" : "배경음악 켜기"}
                  </SecondaryButton>
                </div>
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#73DFFF]/20 bg-[#0B1029]/72 p-3 sm:grid-cols-2">
                  <SecondaryButton onClick={generateCoverImage} disabled={Boolean(imageGenerationMode) || Boolean(sceneImages[0])}>
                    <SparklesIcon className="h-5 w-5" /> {imageGenerationMode === "cover" ? "대표 그림 생성 중" : sceneImages[0] ? "대표 그림 완료" : "대표 그림 만들기"}
                  </SecondaryButton>
                  <SecondaryButton onClick={generatePrintableImages} disabled={Boolean(imageGenerationMode) || printableImagesReady}>
                    <PrinterIcon className="h-5 w-5" /> {imageGenerationMode === "print" ? "출력용 그림 생성 중" : printableImagesReady ? "출력용 그림 완료" : "출력용 그림 만들기"}
                  </SecondaryButton>
                </div>
                {savedStories.length > 1 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {savedStories
                      .filter((savedStory) => savedStory.id !== activeSavedStoryId)
                      .slice(0, 2)
                      .map((savedStory) => (
                        <button
                          key={savedStory.id}
                          type="button"
                          onClick={() => openSavedStory(savedStory)}
                          className="rounded-2xl border border-[#73DFFF]/25 bg-[#151F41] px-4 py-3 text-left transition hover:border-[#FFB15D] active:scale-[0.98]"
                        >
                          <span className="block text-xs font-black text-[#7DFFD4]">{formatSavedStoryDate(savedStory.createdAt)}</span>
                          <span className="mt-1 block truncate text-sm font-black text-white">{savedStory.character.name} / {savedStory.place.name}</span>
                        </button>
                      ))}
                  </div>
                ) : null}
                <div className="mt-auto grid grid-cols-1 gap-3 border-t border-[#73DFFF]/20 pt-4 sm:grid-cols-3">
                  <PrimaryButton onClick={reset}>
                    처음으로 <HomeIcon className="h-6 w-6" />
                  </PrimaryButton>
                  <PrimaryButton onClick={createStory}>
                    다시 짓기 <ArrowPathIcon className="h-6 w-6" />
                  </PrimaryButton>
                  <PrimaryButton onClick={() => setStep("character")}>
                    새 동화 <SparklesIcon className="h-6 w-6" />
                  </PrimaryButton>
                </div>
              </div>
            ) : null}

            {step !== "loading" && step !== "result" ? (
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#73DFFF]/20 pt-5">
                <SecondaryButton onClick={() => (currentStepIndex <= 0 ? reset() : move(-1))}>
                  <ArrowLeftIcon className="h-5 w-5" /> 이전
                </SecondaryButton>
                {step === "events" ? (
                  <PrimaryButton onClick={createStory}>
                    동화 만들기 <SparklesIcon className="h-6 w-6" />
                  </PrimaryButton>
                ) : (
                  <PrimaryButton onClick={() => move(1)}>
                    다음 <ArrowRightIcon className="h-6 w-6" />
                  </PrimaryButton>
                )}
              </div>
            ) : null}
          </div>
        </div>
        {step === "result" ? (
          <div className="z-10 mx-auto grid w-full max-w-[1180px] grid-cols-2 gap-4 pb-2">
            <SecondaryButton onClick={printStorybook} disabled={Boolean(imageGenerationMode)}>
              <ArrowDownTrayIcon className="h-5 w-5" /> {imageGenerationMode === "print" ? "PDF 준비 중" : "PDF로 저장하기"}
            </SecondaryButton>
            <SecondaryButton onClick={downloadStorybook} disabled={Boolean(imageGenerationMode)}>
              <PrinterIcon className="h-5 w-5" /> HTML 백업 저장
            </SecondaryButton>          </div>
        ) : null}
        </>
        )}
      </section>
    </main>
  );
}

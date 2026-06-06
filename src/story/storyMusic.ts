export type StoryMusicState = "paused" | "playing";
export type StoryMusicGenreId = "braveQuest" | "cloudsGold" | "moonlitAcorn" | "moonlitCradle" | "morningSprout" | "cloudsGoldAlt";
export type StoryMusicGenre = {
  id: StoryMusicGenreId;
  label: string;
  description: string;
  audioSrc: string;
  volume: number;
};

export const musicGenres: StoryMusicGenre[] = [
  {
    id: "braveQuest",
    label: "모험",
    description: "씩씩한 모험 장면에 어울리는 음악",
    audioSrc: "/images/Brave%20Little%20Quest.mp3",
    volume: 0.46
  },
  {
    id: "cloudsGold",
    label: "황금구름",
    description: "밝고 따뜻한 장면에 어울리는 음악",
    audioSrc: "/images/Clouds%20of%20Gold.mp3",
    volume: 0.42
  },
  {
    id: "moonlitAcorn",
    label: "달빛도토리",
    description: "잔잔하고 신비로운 장면에 어울리는 음악",
    audioSrc: "/images/Moonlit%20Acorn.mp3",
    volume: 0.38
  },
  {
    id: "moonlitCradle",
    label: "달빛자장",
    description: "글을 읽기 좋은 가장 차분한 음악",
    audioSrc: "/images/Moonlit%20Cradle.mp3",
    volume: 0.4
  },
  {
    id: "morningSprout",
    label: "아침새싹",
    description: "밝고 산뜻한 장면에 어울리는 음악",
    audioSrc: "/images/Morning%20Sprout.mp3",
    volume: 0.42
  },
  {
    id: "cloudsGoldAlt",
    label: "구름빛",
    description: "부드러운 마무리 장면에 어울리는 음악",
    audioSrc: "/images/Clouds%20of%20Gold1.mp3",
    volume: 0.4
  }
];

export const defaultMusicGenreId: StoryMusicGenreId = "moonlitCradle";

export function getMusicGenre(id: StoryMusicGenreId) {
  return musicGenres.find((genre) => genre.id === id) || musicGenres.find((genre) => genre.id === defaultMusicGenreId) || musicGenres[0];
}

export function nextMusicState(current: StoryMusicState): StoryMusicState {
  return current === "playing" ? "paused" : "playing";
}

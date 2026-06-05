export type StoryMusicState = "paused" | "playing";
export type StoryMusicGenreId = "adventure" | "mystery" | "calm" | "cheerful" | "heartwarming";
export type StoryMusicGenre = {
  id: StoryMusicGenreId;
  label: string;
  description: string;
  intervalMs: number;
  noteDuration: number;
  waveform: OscillatorType;
  notes: number[];
};

export const musicGenres: StoryMusicGenre[] = [
  {
    id: "adventure",
    label: "모험",
    description: "탐험을 떠나는 빠르고 밝은 리듬",
    intervalMs: 620,
    noteDuration: 0.42,
    waveform: "triangle",
    notes: [392, 494, 587, 659, 587, 494, 523, 659]
  },
  {
    id: "mystery",
    label: "신비",
    description: "마법과 비밀이 떠오르는 반짝이는 분위기",
    intervalMs: 840,
    noteDuration: 0.7,
    waveform: "sine",
    notes: [330, 392, 466, 587, 523, 466]
  },
  {
    id: "calm",
    label: "평온",
    description: "글을 읽기 좋은 차분한 배경음악",
    intervalMs: 980,
    noteDuration: 0.82,
    waveform: "sine",
    notes: [349, 392, 440, 392, 330, 392]
  },
  {
    id: "cheerful",
    label: "명랑",
    description: "밝고 통통 튀는 즐거운 느낌",
    intervalMs: 540,
    noteDuration: 0.34,
    waveform: "square",
    notes: [523, 659, 784, 659, 698, 784, 659, 523]
  },
  {
    id: "heartwarming",
    label: "감동",
    description: "따뜻한 결말과 친구 이야기에 어울리는 선율",
    intervalMs: 920,
    noteDuration: 0.76,
    waveform: "triangle",
    notes: [294, 370, 440, 494, 440, 370, 392]
  }
];

export const defaultMusicGenreId: StoryMusicGenreId = "calm";

export function getMusicGenre(id: StoryMusicGenreId) {
  return musicGenres.find((genre) => genre.id === id) || musicGenres.find((genre) => genre.id === defaultMusicGenreId) || musicGenres[0];
}

export function nextMusicState(current: StoryMusicState): StoryMusicState {
  return current === "playing" ? "paused" : "playing";
}

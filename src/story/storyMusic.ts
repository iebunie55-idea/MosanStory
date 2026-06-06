export type StoryMusicState = "paused" | "playing";
export type StoryMusicGenreId = "adventure" | "mystery" | "calm" | "cheerful" | "heartwarming";
export type StoryMusicGenre = {
  id: StoryMusicGenreId;
  label: string;
  description: string;
  intervalMs: number;
  chordDuration: number;
  melodyDuration: number;
  waveform: OscillatorType;
  padWaveform: OscillatorType;
  chords: number[][];
  melody: number[];
  masterGain: number;
  padGain: number;
  melodyGain: number;
};

export const musicGenres: StoryMusicGenre[] = [
  {
    id: "adventure",
    label: "모험",
    description: "탐험을 떠나는 밝지만 부드러운 리듬",
    intervalMs: 860,
    chordDuration: 1.8,
    melodyDuration: 0.36,
    waveform: "triangle",
    padWaveform: "sine",
    chords: [
      [261.63, 329.63, 392],
      [293.66, 349.23, 440],
      [329.63, 392, 493.88],
      [261.63, 349.23, 440]
    ],
    melody: [523.25, 587.33, 659.25, 587.33, 523.25, 440],
    masterGain: 0.038,
    padGain: 0.48,
    melodyGain: 0.52
  },
  {
    id: "mystery",
    label: "신비",
    description: "마법과 비밀이 떠오르는 잔잔한 분위기",
    intervalMs: 1080,
    chordDuration: 2.2,
    melodyDuration: 0.48,
    waveform: "sine",
    padWaveform: "sine",
    chords: [
      [220, 277.18, 329.63],
      [246.94, 293.66, 369.99],
      [207.65, 261.63, 329.63],
      [233.08, 293.66, 349.23]
    ],
    melody: [440, 493.88, 554.37, 493.88, 415.3, 369.99],
    masterGain: 0.034,
    padGain: 0.48,
    melodyGain: 0.46
  },
  {
    id: "calm",
    label: "평온",
    description: "글을 읽기 좋은 차분한 배경음악",
    intervalMs: 1240,
    chordDuration: 2.6,
    melodyDuration: 0.54,
    waveform: "sine",
    padWaveform: "sine",
    chords: [
      [196, 261.63, 329.63],
      [174.61, 220, 293.66],
      [164.81, 220, 261.63],
      [196, 246.94, 293.66]
    ],
    melody: [392, 440, 392, 329.63, 349.23, 392],
    masterGain: 0.032,
    padGain: 0.48,
    melodyGain: 0.44
  },
  {
    id: "cheerful",
    label: "명랑",
    description: "밝고 즐겁지만 귀에 편한 느낌",
    intervalMs: 760,
    chordDuration: 1.6,
    melodyDuration: 0.3,
    waveform: "triangle",
    padWaveform: "sine",
    chords: [
      [261.63, 329.63, 392],
      [293.66, 369.99, 440],
      [349.23, 440, 523.25],
      [329.63, 392, 493.88]
    ],
    melody: [523.25, 659.25, 587.33, 659.25, 698.46, 587.33, 523.25],
    masterGain: 0.036,
    padGain: 0.46,
    melodyGain: 0.54
  },
  {
    id: "heartwarming",
    label: "감동",
    description: "따뜻한 결말과 친구 이야기에 어울리는 선율",
    intervalMs: 1160,
    chordDuration: 2.4,
    melodyDuration: 0.5,
    waveform: "triangle",
    padWaveform: "sine",
    chords: [
      [196, 246.94, 329.63],
      [220, 277.18, 349.23],
      [174.61, 220, 293.66],
      [196, 261.63, 329.63]
    ],
    melody: [392, 440, 493.88, 440, 392, 329.63, 369.99],
    masterGain: 0.034,
    padGain: 0.48,
    melodyGain: 0.45
  }
];

export const defaultMusicGenreId: StoryMusicGenreId = "calm";

export function getMusicGenre(id: StoryMusicGenreId) {
  return musicGenres.find((genre) => genre.id === id) || musicGenres.find((genre) => genre.id === defaultMusicGenreId) || musicGenres[0];
}

export function nextMusicState(current: StoryMusicState): StoryMusicState {
  return current === "playing" ? "paused" : "playing";
}

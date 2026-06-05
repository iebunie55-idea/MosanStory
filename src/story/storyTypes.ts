export type Choice = {
  id: string;
  label: string;
};

export type CharacterChoice = {
  id: string;
  name: string;
  emoji: string;
  color: string;
};

export type PlaceChoice = {
  id: string;
  name: string;
  sceneKey: string;
  color: string;
  imageSrc: string;
};

export type StorySelection = {
  character: { id: string; name: string; emoji?: string };
  trait: { id: string; label: string };
  place: { id: string; name: string; sceneKey: string };
  events: {
    opening: Choice;
    development: Choice;
    climax: Choice;
    ending: Choice;
  };
};

export type StoryResult = {
  pages: string[];
  source: "ai" | "local";
  provider?: string;
};

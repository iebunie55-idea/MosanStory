export type StoryPdfMetadataInput = {
  classId: string;
  characterName: string;
  createdAt: Date;
};

export function buildStoryPdfMetadata(input: StoryPdfMetadataInput) {
  const date = input.createdAt.toISOString().slice(0, 10);

  return {
    title: `${input.characterName}의 모산초 AI 동화책`,
    schoolLabel: "모산초등학교 3~6학년 동화 만들기",
    filename: `${input.classId}-story-${date}.pdf`
  };
}

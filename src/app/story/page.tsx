import type { Metadata } from "next";
import { StoryClient } from "./StoryClient";

export const metadata: Metadata = {
  title: "AI와 함께 만드는 동화",
  description: "모산초등학교 3~6학년을 위한 AI 동화책 만들기 수업"
};

export default function StoryPage() {
  return <StoryClient />;
}

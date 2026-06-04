import type { Metadata } from "next";
import { StoryClient } from "./StoryClient";

export const metadata: Metadata = {
  title: "AI와 함께 만드는 동화",
  description: "부여 AI체험센터 키오스크용 3D 동화 만들기 체험"
};

export default function StoryPage() {
  return <StoryClient />;
}

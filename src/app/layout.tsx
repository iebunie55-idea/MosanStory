import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://story-ideacube.local"),
  title: {
    default: "부여 AI STORY",
    template: "%s | 부여 AI STORY"
  },
  description: "부여 AI센터 키오스크용 AI 동화 만들기 체험 앱입니다.",
  keywords: ["부여 AI STORY", "AI 동화", "키오스크", "부여", "동화 만들기"],
  openGraph: {
    title: "부여 AI STORY",
    description: "AI와 함께 나만의 동화를 만드는 키오스크 체험 앱입니다.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/images/story-default-bg.png", width: 1024, height: 1024 }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

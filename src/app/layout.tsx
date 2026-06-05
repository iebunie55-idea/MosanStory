import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://story-ideacube.local"),
  title: {
    default: "모산 AI 동화 만들기",
    template: "%s | 모산 AI 동화 만들기"
  },
  description: "모산초등학교 3~6학년을 위한 AI 동화책 만들기 수업 앱입니다.",
  keywords: ["모산초등학교", "AI 동화", "PWA", "동화 만들기", "수업 앱"],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/images/mori-mascot.png",
    apple: "/images/mori-mascot.png"
  },
  appleWebApp: {
    capable: true,
    title: "모산 AI 동화"
  },
  other: {
    "mobile-web-app-capable": "yes"
  },
  openGraph: {
    title: "모산 AI 동화 만들기",
    description: "AI와 함께 나만의 6쪽 동화책을 만드는 수업 앱입니다.",
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

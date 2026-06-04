import type { CharacterChoice, Choice, PlaceChoice } from "./storyTypes";

export const characters: CharacterChoice[] = [
  { id: "kong", name: "토끼 콩이", emoji: "T", color: "#F8C9D4" },
  { id: "gaya", name: "소녀 가야", emoji: "G", color: "#F2B33D" },
  { id: "dani", name: "소년 단이", emoji: "D", color: "#8BD3DD" },
  { id: "robot", name: "꼬마 로봇 또박이", emoji: "R", color: "#B9C2FF" },
  { id: "miyo", name: "고양이 미요", emoji: "M", color: "#F5A36C" },
  { id: "buri", name: "아기 용 부리", emoji: "B", color: "#7ED7A5" }
];

export const traits: Choice[] = [
  { id: "brave", label: "용감한" },
  { id: "kind", label: "친절한" },
  { id: "curious", label: "호기심 많은" },
  { id: "playful", label: "엉뚱한" },
  { id: "steady", label: "차분한" },
  { id: "adventure", label: "모험을 좋아하는" }
];

export const places: PlaceChoice[] = [
  { id: "village", name: "평화로운 마을", sceneKey: "village", color: "#1F8A74" },
  { id: "forest", name: "요정의 숲", sceneKey: "forest", color: "#4AA66B" },
  { id: "island", name: "환상적인 섬", sceneKey: "island", color: "#4CA7D8" },
  { id: "sea", name: "반짝이는 바닷속", sceneKey: "sea", color: "#2386C8" },
  { id: "cloud", name: "구름 위의 성", sceneKey: "cloud", color: "#8E9CE8" },
  { id: "baekma", name: "백마강 가", sceneKey: "baekma", color: "#2D9C8C" },
  { id: "gungnamji", name: "궁남지", sceneKey: "gungnamji", color: "#D989A6" }
];

export const eventGroups = {
  opening: [
    { id: "lost-light", label: "작은 빛을 발견했어요" },
    { id: "letter", label: "비밀 편지가 도착했어요" },
    { id: "festival", label: "마을 축제가 시작됐어요" },
    { id: "friend", label: "새 친구를 만났어요" },
    { id: "sound", label: "이상한 소리가 들렸어요" },
    { id: "door", label: "작은 문이 열렸어요" }
  ],
  development: [
    { id: "map", label: "오래된 지도를 따라갔어요" },
    { id: "promise", label: "중요한 약속을 지키려 했어요" },
    { id: "puzzle", label: "수수께끼를 풀었어요" },
    { id: "bridge", label: "무너진 다리를 고쳤어요" },
    { id: "helper", label: "도움을 주는 친구를 만났어요" },
    { id: "trail", label: "반짝이는 흔적을 따라갔어요" }
  ],
  climax: [
    { id: "storm", label: "갑자기 큰 바람이 불었어요" },
    { id: "dark", label: "길이 어두워졌어요" },
    { id: "missing", label: "소중한 물건이 사라졌어요" },
    { id: "choice", label: "어려운 선택을 해야 했어요" },
    { id: "tower", label: "높은 탑에 올라가야 했어요" },
    { id: "gate", label: "닫힌 문을 열어야 했어요" }
  ],
  ending: [
    { id: "share", label: "모두와 기쁨을 나눴어요" },
    { id: "home", label: "따뜻한 집으로 돌아왔어요" },
    { id: "garden", label: "새 정원을 만들었어요" },
    { id: "memory", label: "잊지 못할 추억이 되었어요" },
    { id: "party", label: "작은 축하 파티를 열었어요" },
    { id: "promise-again", label: "다시 만나기로 약속했어요" }
  ]
} satisfies Record<string, Choice[]>;

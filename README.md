# 모산 AI 동화 만들기

모산초등학교 3~6학년 학생들이 태블릿으로 AI 동화책을 만드는 수업용 앱입니다.

## 주요 구성

```txt
src/app/story/          /story 페이지
src/story/              동화 만들기 UI, 데이터, 클라이언트 엔진
story-proxy/            Gemini 프록시 서버
public/images/          동화 앱 기본 이미지와 모리 캐릭터
install-buyeo-story.bat AI센터 PC 설치 스크립트
start-buyeo-story.bat   키오스크 실행 스크립트
stop-buyeo-story.bat    서버 종료 스크립트
```

## 개발 실행

```bash
npm install
npm run dev
```

별도 터미널에서:

```bash
cd story-proxy
npm install
node server.js
```

브라우저에서 확인:

```txt
http://127.0.0.1:3000/story
```

## AI센터 로컬 PC 설치

자세한 설치 안내는 `AI_CENTER_INSTALL.md`를 확인합니다.

운영 PC에서는 아래 순서로 사용합니다.

```txt
install-buyeo-story.bat
start-buyeo-story.bat
```

## 환경 변수

API 키는 GitHub에 올리지 않습니다.

```txt
story-proxy\.env
```

예시는 아래 파일을 참고합니다.

```txt
story-proxy\.env.example
```

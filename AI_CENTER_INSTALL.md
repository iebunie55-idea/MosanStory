# 부여 AI STORY 로컬 PC 설치 안내

## 1. 설치 위치

AI센터 체험 PC에 이 폴더를 통째로 복사합니다.

권장 위치:

```text
C:\BuyeoAIStory
```

## 2. API 키 확인

아래 파일에 키가 들어 있어야 합니다.

```text
story-proxy\.env
```

브라우저에는 API 키가 노출되지 않고, 프록시 서버에서만 사용합니다.

## 3. 최초 설치

관리자 권한이 아니어도 보통 실행 가능합니다.

```text
install-buyeo-story.bat
```

설치 과정:

- Next 앱 패키지 설치
- 프록시 패키지 설치
- 운영 빌드 생성
- Windows 시작프로그램에 자동 실행 바로가기 등록

## 4. 실행

수동 실행:

```text
start-buyeo-story.bat
```

실행 후 Chrome 키오스크 모드로 아래 주소가 열립니다.

```text
http://127.0.0.1:3000/story
```

## 5. 종료

서버를 종료하려면:

```text
stop-buyeo-story.bat
```

Chrome 키오스크 창은 `Alt + F4`로 닫을 수 있습니다.

## 6. 로그

문제가 생기면 아래 파일을 확인합니다.

```text
logs\install.log
logs\startup.log
logs\app.log
logs\proxy.log
```

## 7. 운영 메모

- 체험 PC 재부팅 시 자동으로 앱과 Chrome 키오스크가 실행됩니다.
- 설치 후에는 `npm run build`가 완료되어야 `start-buyeo-story.bat`가 정상 실행됩니다.
- 이 프로젝트는 `output: "export"` 설정을 사용하므로 실행 시 `next start`가 아니라 `serve out` 방식으로 정적 export 결과물을 실행합니다.
- 포트는 기본적으로 `3000`과 `3001`을 사용합니다.

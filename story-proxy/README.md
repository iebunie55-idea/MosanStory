# Buyeo Story Proxy

Local Express proxy for the `/story` kiosk app. API keys stay in this server and are never sent to the browser.

## Setup

```bash
cd story-proxy
npm install
copy .env.example .env
npm start
```

The proxy runs on `http://localhost:3001` by default.

## Environment

Set `PROVIDER` to one of:

- `gemini`
- `claude`
- `openai`
- `upstage`
- `grok`

Fill only the API key for the selected provider. The kiosk app reads from `NEXT_PUBLIC_STORY_PROXY_URL`; when unset, it uses `http://localhost:3001`.

## Endpoints

- `GET /api/health` returns `{ ok, provider, model, keyLoaded }`.
- `POST /api/story` accepts `{ selection }` and returns `{ scenes, provider }`.

If the proxy fails, the browser app falls back to the built-in story engine.

## Image generation

`POST /api/image` generates one image for the current story scene. It uses OpenAI's Image API and requires:

```txt
OPENAI_IMAGE_API_KEY=...
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=low
```

The app intentionally uses a prompt like "warm 3D animated feature film look" instead of naming a specific studio style.

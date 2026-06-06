# Mosan Story Deployment

This project deploys as two services:

1. The student tablet app: a Next.js app hosted on Vercel.
2. The AI proxy: a Node/Express service that keeps API keys off student devices.

## 1. Deploy the proxy on Render

Use `render.yaml` from the repository root, or create a Render Web Service manually with these settings:

```txt
Root Directory: story-proxy
Runtime: Node
Build Command: npm ci
Start Command: npm start
Health Check Path: /api/health
```

Set these Render environment variables:

```txt
PROVIDER=gemini
MAX_PER_MIN=20
GEMINI_API_KEY=<your Gemini API key>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
GEMINI_THINKING_BUDGET=0
CLASS_RESET_CODE=<teacher reset code>
```

After deployment, confirm:

```txt
https://<render-service>.onrender.com/api/health
```

The response should include `ok: true` and `keyLoaded: true`.

## 2. Deploy the app on Vercel

Import the GitHub repository as a Vercel project.

Use the default Next.js build settings:

```txt
Install Command: npm ci
Build Command: npm run build
Output Directory: Next.js default
```

The repository also includes `vercel.json` so Vercel uses the Next.js default output even if the dashboard was previously set to `out`.

Set this Vercel environment variable before production deployment:

```txt
NEXT_PUBLIC_STORY_PROXY_URL=https://<render-service>.onrender.com
```

Deploy the project and open:

```txt
https://<vercel-app>.vercel.app/story
```

Then return to the Render proxy environment settings and add:

```txt
CORS_ORIGIN=https://<vercel-app>.vercel.app
```

Redeploy or restart the Render proxy after saving this value.

## 3. Classroom checklist

- Log in with `mosan-001`.
- Try logging in with `mosan-001` from another browser or tablet and confirm it is blocked.
- Generate one story.
- Generate representative/print images.
- Play and stop background music.
- Save the six-page PDF.
- Use the teacher reset code before the next class.

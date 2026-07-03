# V2R-0.4.2 Deployment Checklist

Use this checklist to verify that GitHub Pages is only the static front end and Vercel is the real AI backend.

## 1. Import Repo Into Vercel

- Import `superwesleyhys-ux/v2r-0-prototype` into Vercel.
- Keep the root directory as the repository root.
- Let Vercel detect the `api/` serverless functions.

## 2. Configure Environment Variables

Set these in Vercel project settings:

```text
OPENAI_API_KEY=your-real-server-side-key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
V2R_ALLOWED_ORIGINS=https://superwesleyhys-ux.github.io,http://localhost:8766,http://127.0.0.1:8766
```

Never commit a real `OPENAI_API_KEY` to GitHub.

## 3. Deploy

- Trigger a Vercel production deployment.
- Copy the production URL, for example:

```text
https://v2r-0-prototype.vercel.app
```

## 4. Verify Backend

Run:

```bash
npm run verify:deploy -- https://your-vercel-url.vercel.app
```

This verifies `/api/health`, GitHub Pages CORS preflight for `/api/structure-ticket`, low-risk AI structuring, empty input handling, and unsupported procurement handling.

Manual health check:

```bash
curl -i https://your-vercel-url.vercel.app/api/health
```

Expected JSON:

```json
{
  "ok": true,
  "service": "v2r-api",
  "keyConfigured": true,
  "modelConfigured": true,
  "model": "gpt-4.1-mini",
  "mockMode": false,
  "allowedOriginsConfigured": true
}
```

Manual low-risk structuring check:

```bash
curl -i -X POST https://your-vercel-url.vercel.app/api/structure-ticket \
  -H "Content-Type: application/json" \
  -d '{"userIntent":"我想要一个夹在桌边的耳机架，还能绕数据线，黑色，不要打孔。"}'
```

Expected:

- `risk_class = A`
- `questions.length <= 3`
- `quotes_allowed = true`
- JSON response, not HTML

## 5. Connect GitHub Pages Front End

Open the GitHub Pages front end:

```text
https://superwesleyhys-ux.github.io/v2r-0-prototype/
```

Use the page's `API Base` field:

```text
https://your-vercel-url.vercel.app
```

Then click `保存`.

For a shareable setup link, URL-encode the API base:

```text
https://superwesleyhys-ux.github.io/v2r-0-prototype/?apiBase=https%3A%2F%2Fyour-vercel-url.vercel.app
```

Console fallback:

```js
localStorage.setItem("v2r_api_base", "https://your-vercel-url.vercel.app");
location.reload();
```

Expected page status:

```text
AI API 代理：已连接
```

## 6. Reset Front-End API Base

Use the page's `清除 API Base` button or run:

```js
localStorage.removeItem("v2r_api_base");
location.reload();
```

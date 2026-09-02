# Shot Explorer

A React-based creative workspace inspired by the shared Google Flow tool experience. It is an independent app and does not modify the original Flow project or source code.

## Features

- Flow-style tool launcher with room for multiple tools
- React Router routes for the launcher and Shot Explorer
- Image upload with perspective, pan, zoom, surprise-angle, reset, favorite, and download controls
- Local canvas fallback so the interface remains usable without an API key
- Optional server-side Gemini image generation through a Vercel Function
- Responsive layout and complete SEO/social metadata

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Gemini setup

Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`. The key is read only by `api/generate.js`; it is never bundled into the browser or committed to Git.

Without the key, Shot Explorer automatically uses its local preview fallback.

## Routes

- `/` and `/tools` — tool launcher
- `/tools/shot-explorer` — Shot Explorer workspace

## Deployment

The project is configured for Vercel with a Vite build and SPA rewrites so direct navigation to either route works correctly.

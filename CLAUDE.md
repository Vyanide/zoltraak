# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

zoltraak is a local-first PDF toolbox: a SvelteKit frontend (`web/`) that renders/manipulates PDFs in the browser and an ElysiaJS backend (`server/`) that does the heavy PDF work. The two are **independent Bun projects** — there is no root `package.json` or workspace; install and run each separately. [Bun](https://bun.sh/) is the package manager and runtime everywhere.

## Commands

Run these from inside `web/` or `server/` (not the repo root).

**web/** (SvelteKit):
- `bun install`
- `bun run dev` — dev server on http://localhost:5173
- `bun run build` — production build (adapter-node → `build/`, run with `bun build/index.js`)
- `bun run check` — type-check (`svelte-kit sync && svelte-check`)

**server/** (ElysiaJS):
- `bun install`
- `bun run dev` — watch mode on http://localhost:3000
- `bun run start` — run once
- `bun run check` — `tsc --noEmit`

**Whole stack** (from repo root): `docker compose up --build` → web on :5173, server on :3000.

There is **no automated test suite and no test runner**. Verify changes with `bun run check` + `bun run build`. For server logic, the established way to verify is a throwaway Bun script that starts the server and exercises an endpoint with `fetch` + `FormData`, asserting on the response (then delete it). When checking a server change locally, note the Docker stack may already hold port 3000 — run on a different `PORT` to avoid a stale container answering.

## Architecture

### Repo shape
```
web/      SvelteKit (Svelte 5 runes, shadcn-svelte, Tailwind v4, adapter-node)
server/   ElysiaJS on Bun; PDF work via @libpdf/core
docker-compose.yml
```

### Organizing principle: Common Closure Principle (CCP)
Code is grouped by **feature / reason-to-change**, not by file type. Honor this when adding code.

- **web** features live in `src/lib/<category>/<tool>/`, grouped by category (e.g. `image/crop/`, `pdf/merge/`, `typography/counter/`); category-less features like `catalog/` and `about/` sit at `src/lib/<feature>/`. Routes in `src/routes/` are thin shells that import a feature's main component.
- **server** features live in `src/modules/<feature>/` as a trio: `model.ts` (TypeBox request schemas), `service.ts` (pure logic), `index.ts` (the Elysia controller). `src/index.ts` mounts the modules + CORS.
- **Shared kernels** (used by multiple features, change for their own reason) are deliberately separate:
  - `web/src/lib/client.ts` — single backend origin + `requestBlob()` / `downloadBlob()` helpers (used by every backend-backed tool, not just PDF).
  - `web/src/lib/pdf/pdfjs.ts` — the lazy pdf.js loader (PDF-only, lives at the `pdf/` category root).
  - `web/src/lib/components/dropzone.svelte` — the shared file drop zone used by every tool.
  - `web/src/lib/components/ui/` — shadcn-svelte primitives.

### Request flow (a PDF tool)
Browser renders/inspects the PDF locally with pdf.js → a feature `api.ts` POSTs the file(s) via the shared `client.ts` to the backend (`/pdf/...`) → the controller validates and calls a pure `PdfService` method (LibPDF) → returns the result PDF as a download. The server `PdfService` has **no Elysia/HTTP knowledge** — it returns `{ ok: true, bytes } | { ok: false, error }` and the controller maps that to a `Response` or a `422`.

### The tool catalog
`web/src/lib/catalog/tools.ts` is the registry of categories + tools that drives the index page. Each tool has an `href`, a Lucide `icon`, and an optional `status: 'coming-soon'`. To add a tool: build `lib/<tool>/`, add a route at `routes/<category>/<tool>/+page.svelte` (routes are grouped by category, e.g. `image/crop`), add the server module/route, and register it here.

## Conventions & gotchas (non-obvious)

- **No `svelte.config.js`.** This is the newer SvelteKit layout where Kit config lives inside `sveltekit({...})` in `web/vite.config.ts`. The adapter is configured there too (currently `@sveltejs/adapter-node`).
- **shadcn-svelte CLI must be run with `--bun`:** `bun x --bun shadcn-svelte@latest add <component>`. Under Node, the registry fetch fails in this environment; Bun's fetch works. Components install into `lib/components/ui/`.
- **pdf.js is browser-only.** Never import `pdfjs-dist` at module top level — it touches browser globals at eval time and breaks SSR. Always go through `lib/pdf/pdfjs.ts` (`getPdfjs()`), which dynamic-imports it and loads the worker via a Vite `?url` import. `web/src/app.d.ts` carries `/// <reference types="vite/client" />` so `?url` imports type-check.
- **`VITE_SERVER_URL` is a build-time variable** baked into the client bundle (the fetch runs in the *browser*), default `http://localhost:3000`. It must be reachable from the user's browser — in Docker it points at the published port, **not** the `server` compose service name. Override at build time (e.g. `VITE_SERVER_URL=… docker compose build`).
- **Theme is dark + green only, and everything is square.** `web/src/routes/layout.css` sets `:root` and `.dark` to the same palette and `--radius: 0rem`; `app.html` forces `<html class="dark">`. All shadcn component rounding flows through `--radius`, so corners are sharp by design — don't reintroduce rounding.
- **Elysia auto-parses JSON-looking multipart fields.** A form field like `order="[3,1,2]"` arrives already parsed as an array, so its schema is `t.Array(...)` (no manual `JSON.parse`). Multiple same-named file fields become a `t.Files()` array in send order.
- **Binary responses**: the server returns PDFs as `new Response(new Blob([bytes], { type: 'application/pdf' }), { headers: { 'content-disposition': ... } })`. CORS is open to all origins (dev convenience).
- Base Docker image is pinned `oven/bun:1.3.9-slim` (Debian/glibc — chosen over Alpine for the native build tools Vite uses).

See `DOCS.md` (root — setup + full API contract), `README.md` (the project landing page), `web/README.md`, and `server/README.md` for per-project detail.

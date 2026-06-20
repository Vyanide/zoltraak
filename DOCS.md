# zoltraak — Documentation

Architecture, deployment, configuration, and the HTTP API reference for zoltraak.
For a one-page overview see the [README](./README.md); for per-project detail see
[`web/README.md`](./web/README.md) and [`server/README.md`](./server/README.md).

## Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Deployment](#deployment)
   - [Configuration](#configuration)
4. [Local development](#local-development)
5. [API reference](#api-reference)
   - [Conventions](#conventions)
   - [PDF endpoints](#pdf-endpoints)
   - [Image endpoints](#image-endpoints)
6. [Project structure](#project-structure)

## Overview

zoltraak is a self-hosted, local-first toolbox for PDF, image, and text tasks.
Files are processed by a backend you run yourself and are never sent to a
third-party service. It bundles a number of small, single-purpose tools:

- **PDF** — reorder, merge, split, encrypt, unlock (remove password), and extract embedded images.
- **Image** — convert &amp; compress, remove background (AI), pad, crop, and resize.
- **Text / typography** — word counter, case converter, lorem ipsum, and an enchanting-table (Standard Galactic Alphabet) transcriber. These run entirely in the browser.

## Architecture

The repository is two independent [Bun](https://bun.sh/) projects with no shared
root package — each is installed and run separately:

```
zoltraak/
  web/                # SvelteKit frontend (Svelte 5, shadcn-svelte, Tailwind v4)
  server/             # ElysiaJS backend (Bun) — PDF/image processing
  docker-compose.yml  # runs both as a stack
```

Each project is organised by **feature** (Common Closure Principle): code that
changes for the same reason lives together. A typical request flows as follows —
the browser renders or inspects the file locally (e.g. pdf.js for PDF
thumbnails), a feature module POSTs it to the backend over HTTP, the backend runs
a pure service function (LibPDF, sharp, ImageMagick, or an ONNX model), and the
result is streamed back as a download. The frontend and backend are deployed as
separate containers and communicate over HTTP via `VITE_SERVER_URL`.

## Deployment

The whole stack runs with Docker Compose (requires Docker + Compose):

```sh
docker compose up --build
```

| Service          | Default URL             |
| ---------------- | ----------------------- |
| Web (frontend)   | `http://localhost:5173` |
| Server (backend) | `http://localhost:3000` |

### Configuration

Settings live in a `.env` file next to `docker-compose.yml`. Compose loads it
automatically and every value has a default, so the file is optional; copy the
template to start from it:

```sh
cp .env.example .env
```

| Variable          | Default                 | Description                                            |
| ----------------- | ----------------------- | ------------------------------------------------------ |
| `VITE_SERVER_URL` | `http://localhost:3000` | Backend origin baked into the web bundle (build-time). |
| `WEB_PORT`        | `5173`                  | Host port the web app is published on.                 |
| `SERVER_PORT`     | `3000`                  | Host port the backend is published on.                 |

The browser reaches the backend at `VITE_SERVER_URL`, which is **baked into the
web bundle at build time**. After changing it — or `SERVER_PORT`, which it must
match — rebuild with `docker compose up --build`.

## Local development

[Bun](https://bun.sh/) is required. Run the two projects in separate terminals.

**Backend** (`server/`, serves on `http://localhost:3000`):

```sh
cd server
bun install
bun run dev
```

**Frontend** (`web/`, serves on `http://localhost:5173`):

```sh
cd web
bun install
bun run dev
```

The backend must be running for any tool that produces a file server-side (all
PDF and image tools); the typography tools work without it.

## API reference

All routes are served by the backend under its origin (default
`http://localhost:3000`). CORS is open to all origins for development.

### Conventions

- Every endpoint is a `POST` accepting `multipart/form-data`.
- On success the endpoint streams the result as a file attachment, with the
  appropriate `Content-Type` and a `Content-Disposition` filename — a PDF
  (`application/pdf`), an image, or a ZIP (`application/zip`).
- On invalid input the endpoint responds with status `422` and a JSON body
  `{ "error": string }`.
- Numeric fields are coerced before validation; a JSON-looking field such as
  `order="[3,1,2]"` arrives already parsed as an array.

## Project structure

- [`web/`](./web/README.md) — the SvelteKit app. Tools live under
  `src/lib/<category>/<tool>/` (e.g. `image/crop/`, `pdf/merge/`,
  `typography/counter/`); `lib/catalog/` drives the index page, `lib/client.ts`
  is the shared backend client, and routes in `src/routes/<category>/<tool>/`
  are thin shells that import a feature's component.
- [`server/`](./server/README.md) — the ElysiaJS app. Each feature module under
  `src/modules/<feature>/` is a trio — `model.ts` (TypeBox request schemas),
  `service.ts` (pure logic, no HTTP knowledge), and `index.ts` (the Elysia
  controller) — for the `pdf` and `image` modules; `src/index.ts` mounts them
  with CORS.

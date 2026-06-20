# zoltraak — Toolbox (web)

The SvelteKit frontend for zoltraak. The home page is a catalog: pick a category
in the sidebar to see the tools in it. Two PDF tools are implemented — a **Page
Organizer** (drag pages into a new order) and a **PDF Merger** (combine several
PDFs into one) — both backed by the [ElysiaJS](https://elysiajs.com/) server in
`../server`, which does the actual PDF work and returns the result for download.

> A few tools in the catalog are still placeholders ("Coming soon" — e.g. OCR
> and the media/JSON tools); the rest are live. The PDF and image tools need
> the backend in `../server` running to produce a file; the typography tools run
> entirely in the browser.

## Stack

- **[SvelteKit](https://svelte.dev/docs/kit)** (Svelte 5, runes)
- **[shadcn-svelte](https://shadcn-svelte.com/)** + **Tailwind CSS v4** for UI
- **[pdf.js](https://mozilla.github.io/pdf.js/)** (`pdfjs-dist`) to render page thumbnails — runs entirely client-side
- **[svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action)** for drag-to-reorder
- **[Bun](https://bun.sh/)** as the package manager

## Theme

Dark with a green accent, and every component is square (no rounded corners).
It's driven entirely by CSS tokens in `src/routes/layout.css`: the palette lives
in the `:root, .dark` block and `--radius: 0rem` keeps corners sharp across all
shadcn components.

## Getting started

```sh
bun install
bun run dev          # start the dev server (add --open to launch a browser)
```

```sh
bun run build        # production build
bun run preview      # preview the production build
bun run check        # type-check with svelte-check
```

## How it works

- The **catalog** (`src/lib/catalog/`) defines the categories and tools in
  `tools.ts`. The index route filters tools by the category selected in the
  sidebar.
- The **PDF organizer** (`src/lib/pdf/organizer/`):
  1. Loads a PDF locally (file picker or drag-and-drop). The file never leaves
     the browser.
  2. `render.ts` lazily imports pdf.js (keeping it out of the SSR bundle) and
     renders each page to a JPEG thumbnail.
  3. `pdf-editor.svelte` lays the pages out in a grid and wires up
     `svelte-dnd-action` so they can be reordered by dragging.
  4. The current sequence is an array of original page numbers (`pageOrder`) —
     e.g. `[3, 1, 2]` means "new page 1 is original page 3".
  5. `Save order` calls `api.ts`, which POSTs the file + `pageOrder` to the
     backend and downloads the reordered PDF it returns.
- The **PDF merger** (`src/lib/pdf/merge/`): add multiple PDFs, drag to set
  their order, then `Merge PDFs` POSTs them to the backend and downloads the
  combined file. Page counts are read locally via pdf.js.
- The **PDF splitter** (`src/lib/pdf/split/`): renders page thumbnails locally,
  lets you click the pages to keep, then POSTs those page numbers to
  `/pdf/split` and downloads a new PDF containing only them.
- The **password remover** (`src/lib/pdf/password-remove/`): upload a protected
  PDF, enter its password, and download an unlocked copy.
- The **encryptor** (`src/lib/pdf/encrypt/`): upload a PDF, set a password, pick
  an encryption type, and download a password-protected copy. (AES-256 is the
  only cipher the backend can apply today; the rest are shown but disabled.)
- The **image extractor** (`src/lib/pdf/extract-images/`): upload a PDF and
  download its embedded images as a ZIP.
- The **convert &amp; compress** tool (`src/lib/image/convert/`): a studio layout —
  pick a target format (PNG, JPEG, WebP, AVIF, HEIC, TIFF, BMP, GIF, ICO or ICNS)
  and, for the lossy formats, a quality, then POST to `/image/convert` and
  download the re-encoded file (the server does both the format change and the
  quality with ImageMagick). The preview shows the result when the format renders
  in the browser, with a before/after size readout. (Convert and Compress were
  previously separate tools, now merged.)
- The **background remover** (`src/lib/image/background-remove/`): pick a model
  (U²-Net or ISNet Anime), POST a JPEG/PNG/WebP to `/image/remove-background`,
  and get back a transparent PNG — the server runs the ONNX model and composites
  the result with sharp. The result shows over a checkerboard so the transparency
  reads.
- The **image padder** (`src/lib/image/padding/`): choose where to pad (all
  sides, top &amp; bottom, left &amp; right, one side, or a custom amount per
  side) and a colour (or transparent), POST it to `/image/pad`, and download the
  result — the server pads it with sharp's `extend`.
- The **image cropper** (`src/lib/image/crop/`): a native crop overlay drawn
  over the in-browser preview — drag/resize a freeform box or lock it to an
  aspect-ratio preset (1:1, 16:9, …), or type the exact size and position in
  pixels. The selection is converted from displayed to source pixels and POSTed
  to `/image/crop`, where the server extracts it with sharp's `extract`.
- The **image resizer** (`src/lib/image/resize/`): enter a new width and height
  (read from the original on load); with **Keep aspect ratio** on, editing one
  dimension updates the other from the original ratio. POSTs to `/image/resize`,
  where sharp resizes with `fit: 'inside'` (aspect-preserving) or `'fill'`
  (stretch).
- The **word counter** (`src/lib/typography/counter/`): a fully client-side
  tool — counts characters, words, sentences and paragraphs as you type, plus
  reading/speaking-time estimates, with a Clear-all button. No backend involved.
- The **lorem ipsum generator** (`src/lib/typography/lorem-ipsum/`): also fully
  client-side — generate placeholder text by paragraphs, sentences or words,
  optionally starting with the classic opening, and copy it to the clipboard.
- The **case converter** (`src/lib/typography/case/`): client-side too —
  switches the text between UPPERCASE, lowercase, Title Case and Sentence case
  in place, with copy and clear.
- The **enchanting table** (`src/lib/typography/enchanting/`): translates text
  between English and the Standard Galactic Alphabet (the Minecraft
  enchanting-table script) live, rendered with a self-hosted public-domain SGA
  font, with an alphabet reference. Fully client-side — the alphabet has no
  Unicode, so the conversion is a font over the Latin letters.
- The **about / credits page** (`src/lib/about/`): `credits.ts` is the registry
  of every dependency, runtime and upstream model with a link to its source;
  `about.svelte` renders them. Reached from the sidebar footer and the header
  "About" link, with a route at `routes/about/`.
- Shared kernels: `src/lib/client.ts` (the single backend origin +
  request/download helpers, used by every backend-backed tool) and
  `src/lib/pdf/pdfjs.ts` (the lazy pdf.js loader, used by the PDF tools). The
  drop zone is the shared `src/lib/components/dropzone.svelte`.

## Project layout

Code is grouped by feature (Common Closure Principle) — files that change for
the same reason live together — with shared UI primitives kept separate.

Feature folders are grouped by category (`<category>/<tool>/`); cross-cutting
shared kernels sit at the top of `lib/`.

```
src/
  lib/
    client.ts                      # backend origin + request/download helpers (shared kernel)
    catalog/                       # the tool catalog (changes when tools/categories change)
      tools.ts                     #   registry of categories + tools
      category-nav.svelte          #   sidebar / mobile category list
      tool-card.svelte             #   a single tool tile
    pdf/                           # PDF category
      pdfjs.ts                     #   lazy pdf.js loader (SSR-safe), shared by the PDF tools
      organizer/                   #   reorder tool: render.ts, api.ts, pdf-editor.svelte, …
      merge/                       #   merge tool: inspect.ts, api.ts, pdf-merger.svelte, …
      split/  encrypt/  password-remove/  extract-images/
    image/                         # Image category
      crop/  convert/  background-remove/  padding/  resize/
    typography/                    # Typography category (fully client-side tools)
      counter/  lorem-ipsum/  case/  enchanting/
    about/                         # about / credits page
    components/ui/                 # shadcn-svelte primitives (design system)
    utils.ts
  routes/
    +page.svelte                   # index: sidebar + tool grid
    +error.svelte                  # 404 / error page (button back to /)
    about/+page.svelte
    pdf/organizer/+page.svelte     # tool routes, grouped by category (<category>/<tool>)
    image/crop/+page.svelte        # …
    layout.css                     # Tailwind + dark/green theme tokens
```

## Adding things

A new tool:

1. Build the feature under `src/lib/<category>/<tool-name>/` (e.g. `image/crop/`).
2. Add a route at `src/routes/<category>/<tool-name>/+page.svelte` (routes are
   grouped by category, e.g. `image/crop`).
3. Register it (and any new category) in `src/lib/catalog/tools.ts`.

A shadcn component:

```sh
bun x --bun shadcn-svelte@latest add <component>
```

> `--bun` forces the Bun runtime, which is required here for the shadcn-svelte
> registry fetch to work.

## Backend

The PDF reorder request goes to the ElysiaJS server in `../server` (default
`http://localhost:3000`). Start it with `bun run dev` from that folder. To point
the web app at a different origin, set `VITE_SERVER_URL` at build/dev time:

```sh
VITE_SERVER_URL=https://api.example.com bun run build
```

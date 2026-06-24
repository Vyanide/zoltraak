# TODO

Open work and known gaps. See each project's `README.md` for what's already
shipped and the API contract.

## Image — Convert & Compress (`/image/convert`, shipped)

One **Convert & Compress** tool (Convert and Compress used to be separate)
re-encodes an uploaded image into a chosen format with **ImageMagick 7** — the
server pipes the upload through the `magick` command
(`server/src/modules/image/convert.ts`), nothing touches disk. Output targets:
**PNG, JPEG, WebP, AVIF, HEIC, TIFF, BMP, GIF, ICO, ICNS.**

- PNG/TIFF/BMP and the icon formats are lossless (TIFF via LZW).
- For the lossy targets (JPEG/WebP/AVIF/HEIC) an optional `quality` (1–100) is
  passed to ImageMagick's `-quality` — this is the "compress" half. Omit it for
  ImageMagick's default.
- JPEG flattens transparency onto white; ICO/ICNS are shrunk to the icon
  formats' size limits (ICO ≤ 256×256, ICNS padded to a 512×512 square).

> **Merge note.** Compression used to be a separate sharp-only endpoint
> (`/image/compress`, JPEG/PNG/WebP via mozjpeg / palette quantization). It was
> merged into `/image/convert` so any format can be converted *and*
> quality-tuned in one pass. Trade-off: ImageMagick's JPEG `-quality` isn't
> mozjpeg, so the very smallest JPEGs are a touch larger than the old path —
> revisit if best-in-class JPEG/PNG compression matters (could route same-format
> JPEG/PNG/WebP back through sharp/mozjpeg).

JPEG 2000 (`jp2`) and JPEG XL (`jxl`) are wired into neither path, and raw `.rgb`
pixel dumps are unsupported.

Caveats:

- **ImageMagick must be installed.** The Docker image installs it; for local
  `bun run dev`, install it too (`sudo apt-get install imagemagick`, or your
  OS's equivalent) or `/image/convert` returns a clean "not installed" error.
- **AVIF/HEIC need delegates.** Both ride ImageMagick's HEIF coder, so they only
  work if the installed build includes the libheif delegate; otherwise the
  converter returns a "can't write AVIF/HEIC" `422`. The Dockerfile keeps apt
  *recommends* so the delegate libraries come along.
- **Requires ImageMagick 7** (the `magick` command). The Docker base
  (`oven/bun:1.3.9-slim`, Debian 13) installs IM7; a host with only IM6 won't
  have `magick`.

Possible follow-ups: preserve animation when converting animated GIF/WebP
(currently first-frame only); let users choose the flatten colour for JPEG; emit
multi-resolution ICO/ICNS rather than a single size.

## Remove Image Background (`/image/remove-background`, shipped)

Runs an ONNX model with **onnxruntime-node** to produce an alpha matte, then
sharp composites it into a transparent PNG (`server/src/modules/image/
background.ts`). Two user-selectable models: **u2net** (general, ~168 MB) and
**isnet-anime** (anime/illustration, ~168 MB). Uploads are limited to
JPEG/PNG/WebP.

Caveats:

- **Models download on first use** from the rembg releases and cache under
  `server/models/` (gitignored; override with `MODELS_DIR`). The first request
  per model is slow and needs outbound network. In Docker, mount a volume at
  `models/` so they persist across restarts, or pre-bake them into the image.
- **CPU-only inference.** No GPU execution provider is configured — a large
  image can take a few seconds. The model session is built once per model and
  reused.
- **`onnxruntime-node` needs its postinstall to run.** It's listed in the
  server's `trustedDependencies`, so `bun install` runs it (locally and in
  Docker); without that the native binding is missing.
- **Licensing:** u2net is Apache-2.0 (fine for commercial use); isnet-anime
  follows its upstream terms.
- **Memory.** The full image is decoded to raw RGB for compositing, so very
  large uploads are memory-heavy (the upload cap is 25 MB).

Possible follow-ups: a GPU/optimized execution provider; pre-bake or lazy-warm
the models so the first request isn't slow; alpha-matting refinement on the mask
edges (rembg's post-process step); let the user pick the output background
(transparent vs a solid colour).

## PDF — Extract Images (`/pdf/extract-images`) is incomplete

> **⚠️ `server/src/modules/pdf/extract-images.ts` needs improvement.**
> Image extraction is a pragmatic, partial implementation, not a complete one.
> It only handles the common cases and **silently skips** everything else, so
> some PDFs will yield fewer images than they contain (or none). Known gaps:
>
> - Color spaces beyond DeviceRGB / DeviceGray / ICCBased(3|1) — e.g. CMYK
>   (`DeviceCMYK`), `Indexed`/palette, `Separation`, `Lab`, `CalRGB`.
> - Bit depths other than 8 (1/2/4/16 bpc).
> - 1-bit image masks (`ImageMask`), soft masks / alpha (`SMask`) — alpha is
>   dropped; stencil masks are skipped.
> - Other filters: `CCITTFaxDecode`, `JBIG2Decode`, `LZWDecode`, `RunLengthDecode`,
>   and multi-filter chains (e.g. `[ASCII85Decode, DCTDecode]`).
> - Inline images (`BI`/`ID`/`EI` in content streams).
> - It ships a hand-rolled minimal PNG encoder (no interlacing/optimization).
>
> Doing this fully would mean a proper image-decoding pipeline (LibPDF is
> generation-oriented and has no built-in image-extraction API). Treat the
> current output as best-effort and revisit before relying on it.

## Web — Logo / brand

The "Zoltraak beam" mark (violet→aqua gradient, cream highlights, soft pink
glow) is the app's logo. It's the favicon (`web/static/favicon.svg` +
`favicon.ico`, linked from `web/src/app.html`) and the sidebar logo (inline SVG
in `web/src/routes/+page.svelte`, framed in a green square border).

Open items:

- **The mark's SVG is duplicated** in three places — `logo.svg` (repo root),
  `web/static/favicon.svg`, and inline in `+page.svelte`. They're identical
  today but can drift; consider one source of truth (a shared `Logo.svelte` /
  importing the static SVG, with `logo.svg` kept in sync or dropped).
- **Sidebar style is undecided:** the glowing mark sits inside a hard green
  square frame (`border-primary/50`). Decide whether to keep the frame, drop it
  so it matches the bare glowing favicon, or drop the glow at the small sidebar
  size.

## Cross-cutting — returned outputs

Applies to every tool that hands a result back, not one feature.

- **Redesign the UI for returned outputs.** How a tool shows and returns its
  result differs case by case (image result panel + Download, OCR text pane,
  JSON in-place editor, ZIP download, …). Settle on a consistent pattern for
  presenting and downloading a tool's output.
- **Redesign the naming for returned files.** Download filenames are derived ad
  hoc per controller (`-no-bg`, `-rotated`, `-cropped`, `-padded`, `-resized`,
  …). Define one consistent scheme for naming returned files.

# zoltraak — server

The [ElysiaJS](https://elysiajs.com/) backend for zoltraak, running on
[Bun](https://bun.sh/). It performs PDF manipulation with
[LibPDF](https://libpdf.dev/) (`@libpdf/core`), image format conversion +
compression with [ImageMagick](https://imagemagick.org/), other image work
(pad/crop/resize) with [sharp](https://sharp.pixelplumbing.com/), and AI
background removal with ONNX models via
[onnxruntime-node](https://onnxruntime.ai/).

## Running

```sh
bun install
bun run dev      # watch mode on http://localhost:3000
bun run start    # run once
bun run check    # type-check with tsc
```

## API

Both endpoints return a PDF as `application/pdf` (an attachment), or `422` with
`{ "error": string }` on bad input.

### `POST /pdf/reorder`

`multipart/form-data`:

- `file` — the source PDF
- `order` — JSON array of 1-based page numbers in their new sequence, e.g. `[3,1,2]`

(`422` for an out-of-range page, an empty order, or an unreadable PDF.)

### `POST /pdf/split`

`multipart/form-data`:

- `file` — the source PDF
- `pages` — JSON array of 1-based page numbers to **keep**, in output order, e.g. `[1,3,5]`

Returns a new PDF containing only those pages. (`422` for an out-of-range page,
an empty selection, or an unreadable PDF.)

### `POST /pdf/merge`

`multipart/form-data`:

- `files` — a repeated field of two or more PDFs, concatenated in the order received

(`422` for fewer than two files or an unreadable PDF.)

### `POST /pdf/unlock`

`multipart/form-data`:

- `file` — a password-protected PDF
- `password` — the PDF's password

Returns the PDF with its encryption removed. (`422` for a wrong password, a PDF
that isn't encrypted, or an unreadable PDF.)

### `POST /pdf/encrypt`

`multipart/form-data`:

- `file` — an unencrypted PDF
- `password` — the password to lock it with (non-empty)
- `algorithm` — the cipher: `AES-256` (default), `AES-128`, `RC4-128`, `RC4-40`

Returns the encrypted PDF. The password is applied as both the user and owner
password, so it opens the document and also carries the rights to later strip
the protection (e.g. via `/pdf/unlock`). (`422` if the PDF is already encrypted,
the password is empty, or the cipher isn't supported.)

> **Only AES-256 can be applied.** LibPDF 0.4 supports just AES-256 for new
> encryption; the schema accepts the other ciphers for forward compatibility,
> but the service returns a `422` for them today.

### `POST /pdf/extract-images`

`multipart/form-data`:

- `file` — the source PDF

Returns a **ZIP** (`application/zip`) of the embedded images: JPEG/JPEG2000
streams are emitted verbatim, and FlateDecode RGB/grayscale (incl. ICCBased)
images are rebuilt as PNG. Other encodings (CMYK, indexed, 1-bit masks) are
skipped. (`422` if no extractable images are found.)

> **⚠️ Incomplete** — this is a best-effort, partial implementation that
> **silently skips** anything it can't handle, so some PDFs yield fewer images
> than they contain (or none). The full list of known gaps lives in
> [`../TODO.md`](../TODO.md). Revisit before relying on it.

### `POST /image/convert`

The merged **convert + compress** endpoint. `multipart/form-data`:

- `file` — the source image (any format ImageMagick can decode)
- `format` — the target: `png`, `jpeg`, `webp`, `avif`, `heic`, `tiff`, `bmp`,
  `gif`, `ico`, or `icns`
- `quality` — optional `1`–`100`; passed to ImageMagick's `-quality` and only
  meaningful for the lossy formats (JPEG/WebP/AVIF/HEIC). Omitted → ImageMagick's
  own default.

Re-encodes the image into `format` with **ImageMagick 7** — the server pipes the
upload through the `magick` command, so nothing touches disk. PNG/TIFF and the
icon/bitmap formats are lossless (TIFF via LZW); for the lossy formats the
optional `quality` shrinks the file; converting to JPEG flattens transparency
onto white. Animated GIF/WebP are reduced to their first frame. (`422` for a
non-image upload, or if ImageMagick is missing / lacks the AVIF/HEIF delegate.)

> ImageMagick 7 must be on `PATH` (it provides `magick`) — the Docker image
> installs it; for local `bun run dev`, `apt-get install imagemagick` (or your
> OS's equivalent) on a host with ImageMagick 7.

### `POST /image/remove-background`

`multipart/form-data`:

- `file` — the source image (**JPEG, PNG or WebP only**)
- `model` — which ONNX model to use: `u2net` (default, general) or `isnet-anime`
  (anime/illustration)

Runs the chosen model with [onnxruntime-node](https://onnxruntime.ai/) and
returns a **transparent PNG** (`image/png`). sharp does all the pixel work
(decode → resize to the model's input → apply the predicted alpha matte →
re-composite); the model only produces the matte. (`422` for an unreadable image
or if the model can't be loaded.)

> **Models download on first use.** Each model is fetched from the rembg
> releases on first request and cached under `models/` (override with the
> `MODELS_DIR` env var). Both u2net and isnet-anime are ~168&nbsp;MB, so the first
> request for a model is slow and the server needs outbound network access.
> Inference runs on **CPU**. In Docker, mount a volume at `models/` to keep them
> across restarts.

### `POST /image/pad`

`multipart/form-data`:

- `file` — the source image
- `top` / `right` / `bottom` / `left` — per-side padding in pixels (integers ≥ 0)
- `background` — a `#rrggbb` hex, or the literal `transparent`

Adds padding around the image with sharp's `extend`. Opaque padding keeps the
source format; transparent padding returns a **PNG** (the alpha-capable format
here). (`422` for a non-image upload.)

### `POST /image/crop`

`multipart/form-data`:

- `file` — the source image
- `left` / `top` — the crop's top-left corner in source pixels (integers ≥ 0)
- `width` / `height` — the crop's size in source pixels (integers ≥ 1)

Extracts the rectangle with sharp's `extract`, keeping the source format (PNG
fallback otherwise). The rectangle is clamped to the image bounds, so a slightly
out-of-range selection is trimmed rather than rejected. (`422` for a non-image
upload.)

### `POST /image/resize`

`multipart/form-data`:

- `file` — the source image
- `width` / `height` — target size in pixels (integers ≥ 1); at least one is required
- `fit` — `inside` (keep the aspect ratio, default) or `fill` (stretch to exactly
  width × height)

Resizes with sharp's `resize`, keeping the source format (PNG fallback). When
only one dimension is given, the other is scaled proportionally regardless of
`fit`. (`422` if neither dimension is given, or for a non-image upload.)

CORS is enabled for all origins so the web app can call it during development.

## Layout

Feature-based, per the Elysia conventions and the Common Closure Principle —
each module owns its controller, service, and model:

```
src/
  index.ts                 # app entry: CORS + mount modules + listen
  modules/
    pdf/
      index.ts             # controller: reorder / split / merge / unlock / encrypt / extract-images routes
      service.ts           # pure LibPDF logic (no HTTP knowledge)
      model.ts             # TypeBox request schemas
      extract-images.ts    # image extraction + minimal PNG encoder (⚠️ incomplete, see note above)
    image/
      index.ts             # controller: convert / remove-background / pad / crop / resize routes
      service.ts           # pure sharp logic: pad + crop + resize (no HTTP knowledge)
      convert.ts           # image conversion by shelling out to ImageMagick
      background.ts        # background removal: ONNX inference + sharp pre/post
      types.ts             # shared ImageResult type
      model.ts             # TypeBox request schemas
```

`service.ts` is deliberately decoupled from Elysia so the PDF logic can change
(and be tested) independently of the HTTP layer.

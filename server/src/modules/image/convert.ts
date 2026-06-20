import type { ImageResult } from "./types";

/** Image formats the converter can produce (mirrors the model's `format` union). */
export type ConvertFormat =
    | "png"
    | "jpeg"
    | "webp"
    | "avif"
    | "heic"
    | "tiff"
    | "bmp"
    | "gif"
    | "ico"
    | "icns";

/** Per-format output MIME, extension, ImageMagick coder, and encode options. */
const TARGETS: Record<ConvertFormat, { mime: string; ext: string; coder: string; args: string[] }> = {
    png: { mime: "image/png", ext: "png", coder: "png", args: [] },
    // JPEG has no alpha channel — composite transparency onto white first.
    jpeg: { mime: "image/jpeg", ext: "jpg", coder: "jpg", args: ["-background", "white", "-flatten"] },
    webp: { mime: "image/webp", ext: "webp", coder: "webp", args: [] },
    // AVIF and HEIC both use ImageMagick's HEIF coder, so both need the libheif delegate.
    avif: { mime: "image/avif", ext: "avif", coder: "avif", args: [] },
    heic: { mime: "image/heic", ext: "heic", coder: "heic", args: [] },
    // LZW keeps TIFF lossless (a codec choice, not a quality setting).
    tiff: { mime: "image/tiff", ext: "tiff", coder: "tiff", args: ["-compress", "LZW"] },
    bmp: { mime: "image/bmp", ext: "bmp", coder: "bmp", args: [] },
    gif: { mime: "image/gif", ext: "gif", coder: "gif", args: [] },
    // Icon containers have size limits: ICO tops out at 256×256, and ICNS needs a
    // standard square size — shrink (and pad, for ICNS) so ImageMagick can write them.
    ico: { mime: "image/x-icon", ext: "ico", coder: "ico", args: ["-resize", "256x256>"] },
    icns: {
        mime: "image/icns",
        ext: "icns",
        coder: "icns",
        args: ["-resize", "512x512>", "-background", "none", "-gravity", "center", "-extent", "512x512"],
    },
};

/** Turn ImageMagick's noisy stderr into a single human-readable sentence. */
function explain(stderr: string, format: ConvertFormat): string {
    const line =
        stderr
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)[0] ?? "";
    const lower = line.toLowerCase();
    if (lower.includes("no decode delegate") || lower.includes("improper image header") || lower.includes("unable to open image")) {
        return "The uploaded file could not be read as an image.";
    }
    if (lower.includes("no encode delegate") || lower.includes("delegate failed")) {
        return `This server's ImageMagick build can't write ${format.toUpperCase()} images.`;
    }
    const cleaned = line
        .replace(/^(convert|magick):\s*/i, "")
        .replace(/\s*@\s*(error|warning)\/.*$/i, "")
        .trim();
    return cleaned || "The image could not be converted.";
}

/**
 * Convert an image into `format` by shelling out to ImageMagick. The source is
 * piped in on stdin and the result read from stdout, so nothing touches disk.
 *
 * Uses ImageMagick 7's `magick` command. ImageMagick must be installed — the
 * Docker image installs it; for local `bun run dev`, `apt-get install
 * imagemagick` (or your OS equivalent) on a host that provides ImageMagick 7.
 */
export async function convertImage(
    source: Uint8Array,
    format: ConvertFormat,
    quality?: number,
): Promise<ImageResult> {
    const target = TARGETS[format];
    if (!target) return { ok: false, error: `Unsupported target format: ${format}.` };

    const bin = "magick";
    // `-quality` controls the lossy formats' compression; omitted → ImageMagick's
    // own default. `-` reads the (auto-detected) source from stdin; `coder:-`
    // writes the encoded result to stdout.
    const qualityArgs =
        quality != null ? ["-quality", String(Math.min(100, Math.max(1, Math.round(quality))))] : [];
    const argv = [bin, "-", ...qualityArgs, ...target.args, `${target.coder}:-`];

    // The whole spawn-and-read flow is guarded: a failure can surface either as
    // a synchronous throw (binary missing) OR as a rejected promise (stream
    // error, broken pipe, the process dying on a signal). Either way it becomes
    // a clean `{ ok: false }` result instead of escaping as an unhandled 500.
    try {
        const proc = Bun.spawn(argv, { stdin: source, stdout: "pipe", stderr: "pipe" });
        // stdout/stderr are piped, so they are ReadableStreams (the generic
        // default widens them to also include a file descriptor number). Drain
        // both while awaiting exit so a full pipe buffer can't deadlock.
        const stdout = proc.stdout as ReadableStream<Uint8Array>;
        const stderr = proc.stderr as ReadableStream<Uint8Array>;
        const [buf, err, code] = await Promise.all([
            new Response(stdout).arrayBuffer(),
            new Response(stderr).text(),
            proc.exited,
        ]);
        const out = new Uint8Array(buf);

        if (code !== 0 || out.length === 0) {
            return { ok: false, error: explain(err, format) };
        }
        return { ok: true, bytes: out, mime: target.mime, ext: target.ext };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/enoent|not found|no such file|spawn|executable/i.test(message)) {
            return {
                ok: false,
                error: "Image conversion is unavailable: ImageMagick 7 (the `magick` command) is not installed on the server.",
            };
        }
        console.error("ImageMagick conversion failed", error);
        return { ok: false, error: "The image could not be converted." };
    }
}

# syntax=docker/dockerfile:1
FROM oven/bun:1.3.9-slim AS base
WORKDIR /app

# ---- install production dependencies (cached unless manifests change) ----
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
# ImageMagick powers /image/convert (sharp handles the rest). The server shells
# out to the `magick` command — Debian's `imagemagick` package is ImageMagick 7
# here. Recommended packages are kept on purpose: they pull in the optional
# delegate libraries (WebP, HEIF/AVIF, …) that the extra output formats depend on.
RUN apt-get update \
	&& apt-get install -y imagemagick \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY src ./src
EXPOSE 3000
# Bun runs the TypeScript entry directly — no build step needed.
CMD ["bun", "run", "src/index.ts"]

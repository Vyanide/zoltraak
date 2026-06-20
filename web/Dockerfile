# syntax=docker/dockerfile:1

# ---- build ----
FROM oven/bun:1.3.9-slim AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Baked into the client bundle at build time — the URL the *browser* uses to
# reach the backend. Defaults to the server's published port on localhost.
ARG VITE_SERVER_URL=http://localhost:3000
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN bun run build

# ---- runtime ----
# adapter-node produces a self-contained server in build/, so the runtime image
# needs no node_modules.
FROM oven/bun:1.3.9-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["bun", "./build/index.js"]

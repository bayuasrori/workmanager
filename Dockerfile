# ---- Base ----
FROM oven/bun:1.3 AS base
WORKDIR /app

# ---- Install deps ----
FROM base AS install
COPY package.json bun.lock ./
COPY scripts/ scripts/
RUN bun install --frozen-lockfile

# ---- Build ----
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY . .
RUN bun run build

# ---- Runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV ORIGIN=http://localhost:3000

# drizzle-kit needs these at runtime for migrations
COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/src/lib/server/db ./src/lib/server/db
COPY --from=build /app/tsconfig.json ./

COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]

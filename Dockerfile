FROM node:22-alpine AS base
WORKDIR /app

FROM base AS install
COPY package.json ./
COPY scripts/ scripts/
RUN npm install --legacy-peer-deps

FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY package.json ./
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/src/lib/server/db ./src/lib/server/db
COPY --from=install /app/node_modules ./node_modules

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]

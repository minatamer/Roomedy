FROM --platform=linux/amd64 docker.io/library/node:24.19.0-bookworm-slim@sha256:e5a8dee7bc1e6a215d224a7ef8206f7e77271bc3cabd5febf2beafac0674f174 AS build
WORKDIR /work
COPY scripts/release/install-pnpm.mjs scripts/release/identities.json ./scripts/release/
RUN node scripts/release/install-pnpm.mjs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm build:shared
ARG ROOMEDY_RELEASE_ID
ENV NEXT_TELEMETRY_DISABLED=1 ROOMEDY_RELEASE_ID=$ROOMEDY_RELEASE_ID
RUN node -e "if(!/^[a-f0-9]{64}$/.test(process.argv[1]||''))process.exit(1)" "$ROOMEDY_RELEASE_ID"
RUN pnpm --filter @roomedy/frontend build

FROM --platform=linux/amd64 docker.io/library/node:24.19.0-bookworm-slim@sha256:e5a8dee7bc1e6a215d224a7ef8206f7e77271bc3cabd5febf2beafac0674f174 AS runtime
ARG ROOMEDY_RELEASE_ID
LABEL org.roomedy.input-digest=$ROOMEDY_RELEASE_ID
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=8080 ROOMEDY_RELEASE_ID=$ROOMEDY_RELEASE_ID ROOMEDY_SERVICE_IDENTITY=none
WORKDIR /app
COPY --from=build --chown=node:node /work/apps/frontend/.next/standalone/ ./
COPY --from=build --chown=node:node /work/apps/frontend/.next/static/ ./apps/frontend/.next/static/
COPY --from=build --chown=node:node /work/apps/frontend/public/ ./apps/frontend/public/
COPY --chown=node:node scripts/release/check-runtime.mjs ./check-runtime.mjs
# Named context is a validated public-only prior snapshot (or empty static/public dirs).
COPY --from=previous-assets --chown=node:node /static/ ./apps/frontend/.next/static/
COPY --from=previous-assets --chown=node:node /public/ ./apps/frontend/public/
USER node
EXPOSE 8080
STOPSIGNAL SIGTERM
CMD ["node", "apps/frontend/server.js"]

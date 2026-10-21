FROM --platform=linux/amd64 docker.io/library/node:24.19.0-bookworm-slim@sha256:e5a8dee7bc1e6a215d224a7ef8206f7e77271bc3cabd5febf2beafac0674f174 AS build
WORKDIR /work
COPY scripts/release/install-pnpm.mjs scripts/release/identities.json ./scripts/release/
RUN node scripts/release/install-pnpm.mjs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend ./apps/backend
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm build:shared && pnpm --filter @roomedy/backend build
RUN pnpm --filter @roomedy/backend deploy --prod --legacy /out/backend
RUN node --input-type=module -e "import {readlink,unlink} from 'node:fs/promises';import {resolve,dirname} from 'node:path';const link='/out/backend/node_modules/.pnpm/node_modules/@roomedy/backend';if(resolve(dirname(link),await readlink(link))!=='/work/apps/backend')throw new Error('release-deploy-self-link');await unlink(link);"

FROM --platform=linux/amd64 docker.io/library/node:24.19.0-bookworm-slim@sha256:e5a8dee7bc1e6a215d224a7ef8206f7e77271bc3cabd5febf2beafac0674f174 AS runtime
ARG ROOMEDY_RELEASE_ID
RUN node -e "if(!/^[a-f0-9]{64}$/.test(process.argv[1]||''))process.exit(1)" "$ROOMEDY_RELEASE_ID"
LABEL org.roomedy.input-digest=$ROOMEDY_RELEASE_ID
ENV NODE_ENV=production APP_ENV=production HOST=0.0.0.0 PORT=8080 FAKE_MODE=true PAID_DEMO_ENABLED=false ROOMEDY_RELEASE_ID=$ROOMEDY_RELEASE_ID
WORKDIR /app
COPY --from=build --chown=node:node /out/backend/ ./
COPY --chown=node:node scripts/release/check-runtime.mjs ./check-runtime.mjs
USER node
EXPOSE 8080
STOPSIGNAL SIGTERM
CMD ["node", "dist/server.js"]

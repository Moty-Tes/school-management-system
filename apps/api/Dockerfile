FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy monorepo configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy packages and api application
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & compile TypeScript
RUN pnpm --filter @sms/database run build
RUN pnpm --filter @sms/api run build

ENV NODE_ENV=production
ENV API_PORT=4000
EXPOSE 4000

WORKDIR /app/apps/api

CMD ["sh", "-c", "pnpm --filter @sms/database exec prisma db push --skip-generate && (pnpm --filter @sms/database db:seed || true) && node dist/index.js"]

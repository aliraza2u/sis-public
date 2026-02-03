# Stage 1: Base image
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Stage 2: Dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 3: Builder
FROM base AS builder
COPY package.json pnpm-lock.yaml* ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build
# Prune dev dependencies to reduce image size
RUN pnpm prune --prod --ignore-scripts

# Stage 4: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Use non-root user for security
USER node

# Copy application files with correct permissions
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

# Use dumb-init as entrypoint to handle signals
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["./start.sh"]

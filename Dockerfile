FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Caché de pnpm para builds ultra-rápidos
RUN --mount=type=cache,id=pnpm,target=/home/node/.local/share/pnpm/store \
    pnpm config set only-built-dependencies @nestjs/core,@scarf/scarf,sharp,unrs-resolver && \
    pnpm install --frozen-lockfile

COPY --chown=node:node . .

RUN pnpm build

FROM node:22-alpine AS production

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

# Binario de Stripe desde la imagen oficial
COPY --from=stripe/stripe-cli:latest /bin/stripe /usr/local/bin/stripe

ENV NODE_ENV=production
WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml ./

# Instalación limpia de producción
RUN --mount=type=cache,id=pnpm,target=/home/node/.local/share/pnpm/store \
    pnpm config set only-built-dependencies @nestjs/core,@scarf/scarf,sharp,unrs-resolver && \
    pnpm install --prod --frozen-lockfile --shamefully-hoist

COPY --from=builder /app/dist ./dist
COPY start.sh ./

RUN chmod +x start.sh

EXPOSE 3001

USER node

CMD ["./start.sh"]
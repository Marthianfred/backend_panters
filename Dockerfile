FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Ajuste de permisos inicial
RUN chown node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml ./

# Instalación ignorando scripts para evitar fallos de husky/seguridad
RUN --mount=type=cache,id=pnpm,target=/home/node/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# Reconstrucción selectiva de binarios necesarios
RUN pnpm rebuild @nestjs/core @scarf/scarf sharp unrs-resolver

COPY --chown=node:node . .

RUN pnpm build

FROM node:22-alpine AS production

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=stripe/stripe-cli:latest /bin/stripe /usr/local/bin/stripe

ENV NODE_ENV=production
WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml ./

# Instalación de producción optimizada
RUN --mount=type=cache,id=pnpm,target=/home/node/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts --shamefully-hoist

# Reconstrucción selectiva en producción para asegurar binarios de Sharp
RUN pnpm rebuild sharp

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node start.sh ./

RUN chmod +x start.sh

EXPOSE 3001

CMD ["./start.sh"]

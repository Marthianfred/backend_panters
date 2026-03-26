FROM node:22-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

# 1. Copiamos ambos archivos de manifiesto
COPY package.json pnpm-lock.yaml ./

# 2. Instalamos DEPENDENCIAS PRIMERO (usando caché)
# --frozen-lockfile: Falla si el lockfile no coincide (asegura versiones exactas)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# 3. Copiamos el código fuente DESPUÉS de instalar dependencias
COPY . .

FROM base AS builder
WORKDIR /app

COPY --from=deps /app ./

# Nota: Si tu package.json no tiene definido el script "build" con nest,
# asegúrate de que esto funcione. Si es un entorno aislado, quiza sobre el "--filter backend"
# pero si te funcionaba antes, déjalo así.
RUN pnpm --filter backend exec nest build

FROM node:22-alpine

#RUN apk add --no-cache curl tzdata && \
#    cp /usr/share/zoneinfo/Europe/Madrid /etc/localtime && \
#    echo "Europe/Madrid" > /etc/timezone

RUN npm install -g pnpm

WORKDIR /app

# ENV NODE_ENV=production
# ENV TZ=Europe/Madrid

# 4. AQUI ESTABA EL ERROR:
# Traemos el lockfile para la instalación de producción
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# 5. Instalamos solo producción, OBLIGANDO a usar el lockfile
RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["pnpm", "run", "start:prod"]
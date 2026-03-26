# 1. Etapa de Construcción (Builder)
# Esta etapa instala todas las dependencias, construye el proyecto y elimina las dependencias de desarrollo.
FROM node:22-alpine AS builder

WORKDIR /app

# Instala pnpm
RUN npm install -g pnpm

# Copia los archivos de manifiesto del monorepo
# El comodín en pnpm-workspace.yaml evita errores si el archivo no existe
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

# Instala TODAS las dependencias (dev y prod) para poder construir
RUN pnpm install --frozen-lockfile

# Copia todo el código fuente del monorepo
COPY . .

# Construye la aplicación 'backend_panters'
# El filtro se basa en el 'name' dentro de backend_panters/package.json
RUN pnpm --filter backend_panters build

# Mueve la carpeta 'dist' a la raíz para que la etapa de producción la encuentre
# El build la crea en /app/backend_panters/dist, la movemos a /app/dist
RUN mv /app/backend_panters/dist /app/dist

# Elimina las dependencias de desarrollo para aligerar node_modules
RUN pnpm prune --prod


# 2. Etapa de Producción (Production)
# Esta etapa crea la imagen final, copiando solo lo necesario desde la etapa de construcción.
FROM node:22-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Instala pnpm para poder ejecutar el comando de inicio
RUN npm install -g pnpm

# Copia el package.json específico del backend para poder usar sus scripts ('start:prod')
COPY --from=builder /app/backend_panters/package.json ./package.json

# Copia la carpeta node_modules ya optimizada (sin dependencias de desarrollo)
COPY --from=builder /app/node_modules ./node_modules

# Copia la aplicación ya compilada
COPY --from=builder /app/dist ./dist

# Expone el puerto en el que la aplicación escucha dentro del contenedor (el default de NestJS es 3000)
EXPOSE 3001

# Comando para iniciar la aplicación en modo producción
CMD ["pnpm", "start:prod"]

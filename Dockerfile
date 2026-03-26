# --- Etapa 1: Construcción (Builder) ---
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar TODAS las dependencias (necesarias para el build)
RUN pnpm install --frozen-lockfile

# Copiar el código fuente
COPY . .

# Compilar la aplicación NestJS (esto genera la carpeta /dist)
RUN pnpm build


# --- Etapa 2: Producción (Runner) ---
FROM node:22-alpine AS production

# Establecer la variable de entorno para producción
ENV NODE_ENV=production

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar SOLO dependencias de producción.
# El flag --shamefully-hoist asegura que Node encuentre 'express' y otras sub-dependencias,
# actuando como una red de seguridad para el error MODULE_NOT_FOUND.
RUN pnpm install --prod --frozen-lockfile --ignore-scripts --shamefully-hoist

# Copiar los archivos compilados desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Exponer el puerto de tu aplicación (asegúrate de que coincida con tu main.ts)
EXPOSE 3001

# Ejecutar el binario de Node directamente (Mejor práctica en Docker)
CMD ["node", "dist/main.js"]
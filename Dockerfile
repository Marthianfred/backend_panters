FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:22-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder package.json ./package.json
COPY --from=builder pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --prod --no-frozen-lockfile --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["pnpm", "start:prod"]

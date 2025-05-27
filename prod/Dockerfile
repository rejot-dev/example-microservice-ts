FROM oven/bun:1.2.6 AS builder

WORKDIR /app

COPY package.json .
COPY bun.lock .
COPY apps/shop/package.json ./apps/shop/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN bun install
COPY . .
RUN cd apps/shop && bun run build

FROM nginx:stable-alpine AS prod

COPY --from=builder /app/apps/shop/dist /usr/share/nginx/html
COPY prod/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
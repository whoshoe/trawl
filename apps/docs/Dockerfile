FROM oven/bun:1.3.14-alpine AS builder

# git is required by VitePress lastUpdated (reads commit timestamps)
RUN apk add --no-cache git

WORKDIR /app

COPY apps/docs/package.json ./package.json
RUN bun install

COPY apps/docs/ ./
RUN bun run build

FROM nginx:alpine AS runner

COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html
COPY apps/docs/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

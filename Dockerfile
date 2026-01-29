FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

# Install openssl + ca-certs for Prisma/query engine
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY src ./src

# Non-root
RUN useradd -m -u 10001 appuser
USER appuser

EXPOSE 3000

CMD ["sh", "-c", "npm run prisma:deploy && node src/server.js"]


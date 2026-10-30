FROM node:24-alpine@sha256:feb76650b7195319268c59cb2d419c732d6c499b13bf5296f16ab59eb1f0a4f3

WORKDIR /app/csm
COPY csm/package.json csm/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY csm/*.mjs ./
COPY csm/migrations/ ./migrations/
COPY shared/corporate-site.mjs /app/shared/corporate-site.mjs
RUN chown -R node:node /app
USER node

EXPOSE 46124
CMD ["node", "server.mjs"]

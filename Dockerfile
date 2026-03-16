FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/

RUN npm ci --ignore-scripts && npx prisma generate --schema=packages/api/prisma/schema.prisma || true

COPY packages/api packages/api
COPY packages/shared packages/shared

RUN cd packages/api && npx nest build

EXPOSE 3001

CMD ["node", "packages/api/dist/main.js"]

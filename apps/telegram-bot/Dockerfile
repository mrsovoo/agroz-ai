FROM node:24-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production

CMD ["node", "--experimental-strip-types", "src/index.ts"]


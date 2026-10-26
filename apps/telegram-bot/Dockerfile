FROM node:24-alpine

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production

CMD ["node", "--experimental-strip-types", "src/index.ts"]



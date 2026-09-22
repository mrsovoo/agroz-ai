# Production Dockerfile for Agroz AI Backend
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

EXPOSE 4000

CMD ["npm", "start"]

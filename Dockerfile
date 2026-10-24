FROM node:20-alpine
WORKDIR /app

# 1. Install backend dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# 2. Copy backend source code
COPY backend/ ./

ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

CMD ["node", "server.js"]


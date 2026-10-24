FROM node:20-alpine
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# 2. Copy source code
COPY ./ ./

ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

CMD ["node", "server.js"]


FROM node:20-alpine
WORKDIR /app

# 1. Install dependencies for api-backend
COPY apps/api-backend/package*.json ./
RUN npm install --omit=dev

# 2. Copy backend source code
COPY apps/api-backend/ ./

ENV NODE_ENV=production
EXPOSE 5001 8080

CMD ["npm", "start"]

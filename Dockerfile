# Stage 1: Build Super Admin frontend
FROM node:20-alpine AS admin-builder
WORKDIR /super-adm
COPY super-adm/package*.json ./
RUN npm install
COPY super-adm/ ./
RUN npm run build

# Stage 2: Runtime server
FROM node:20-alpine
WORKDIR /app

# 1. Install backend dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# 2. Copy backend source code
COPY backend/ ./

# 3. Copy built Super Admin frontend to public/admin
COPY --from=admin-builder /super-adm/dist ./public/admin

ENV NODE_ENV=production
EXPOSE 5001 8080

CMD ["npm", "start"]

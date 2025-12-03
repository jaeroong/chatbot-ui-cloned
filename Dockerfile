# Stage 1: build
FROM node:20-bullseye AS builder

WORKDIR /app

# Copy package.json + install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Stage 2: production
FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

CMD ["npm", "start"]

# Stage 1: Build the Vite frontend
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build with relative token URL so frontend uses same origin in production
ENV VITE_TOKEN_SERVER_URL=/getToken
RUN npm run build

# Stage 2: Production — Express serves API + static files
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "server.js"]

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build-time environment variables for Vite
ARG VITE_API_SCHEME=http
ARG VITE_API_HOST=localhost
ARG VITE_API_PORT=8001

ENV VITE_API_SCHEME=$VITE_API_SCHEME
ENV VITE_API_HOST=$VITE_API_HOST
ENV VITE_API_PORT=$VITE_API_PORT

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]

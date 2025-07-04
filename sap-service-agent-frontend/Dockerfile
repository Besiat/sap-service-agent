# Production stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build

FROM node:20-alpine AS production
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist/sap-service-agent-frontend/browser ./dist
EXPOSE 4200
CMD ["serve", "-s", "dist", "-l", "4200"]

# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
EXPOSE 4200
CMD ["yarn", "start", "--", "--host", "0.0.0.0"]

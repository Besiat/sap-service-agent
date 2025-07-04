FROM node:20-alpine AS development
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
EXPOSE 3000
CMD yarn migration:run:all && yarn start:dev

FROM node:20-alpine AS production
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build:api && yarn build:worker && yarn install --production && yarn cache clean
EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/auth/tenants || exit 1
CMD yarn migration:run:all && yarn start:prod

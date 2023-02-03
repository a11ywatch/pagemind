FROM rust:alpine3.16 AS rustbuilder

WORKDIR /app

ENV GRPC_HOST=0.0.0.0:50052

RUN apk upgrade --update-cache --available && \
	apk add npm gcc cmake make g++

RUN npm install @a11ywatch/protos

COPY . .

RUN cargo install --no-default-features --path .

FROM node:19.5-alpine AS BUILD_IMAGE

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

WORKDIR /usr/src/app

COPY . .

RUN npm ci
RUN npm run build
RUN rm -R ./node_modules
RUN npm install --production

# final image
FROM node:19.5-alpine

RUN apk upgrade --update-cache --available && \
	apk add openssl

ENV GRPC_HOST_MAV="mav:50053" \
    NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=rustbuilder /usr/local/cargo/bin/health_client /usr/local/bin/health_client

EXPOSE 50052

CMD [ "node", "--no-experimental-fetch", "./dist/server.js"]

FROM rust:alpine3.17 AS rustbuilder

WORKDIR /app

ENV GRPC_HOST=0.0.0.0:50052

RUN apk upgrade --update-cache --available && \
	apk add npm gcc cmake make g++

RUN npm install @a11ywatch/protos

COPY . .

RUN cargo install --no-default-features --path .

FROM node:20.8-alpine3.17 AS BUILD_IMAGE

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="true"

WORKDIR /usr/src/app

COPY . .

RUN npm ci
RUN npm run build
RUN rm -R ./node_modules
RUN npm install --production

# final image
FROM node:20.8-alpine3.17

RUN apk upgrade --update-cache --available && \
	apk add openssl

RUN npx playwright install ffmpeg

ENV GRPC_HOST_MAV="mav:50053" \
    NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=rustbuilder /usr/local/cargo/bin/health_client /usr/local/bin/health_client

EXPOSE 50052

CMD [ "node", "--no-experimental-fetch", "./dist/server.js"]

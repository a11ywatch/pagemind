FROM --platform=$BUILDPLATFORM rustlang/rust:nightly AS rustbuilder

WORKDIR /app

ENV GRPC_HOST=0.0.0.0:50052

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    gcc cmake libc6 npm

RUN npm install @a11ywatch/protos

COPY . .

RUN cargo install --no-default-features --path .

FROM node:17.9-buster-slim AS BUILD_IMAGE

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

WORKDIR /usr/src/app

COPY . .

RUN npm ci
RUN npm run build
RUN rm -R ./node_modules
RUN npm install --production

# final image
FROM node:17.9-buster-slim

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=rustbuilder /usr/local/cargo/bin/health_client /usr/local/bin/health_client

EXPOSE 50052

CMD [ "node", "--no-experimental-fetch", "./dist/server.js"]

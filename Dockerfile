FROM --platform=$BUILDPLATFORM rustlang/rust:nightly AS rustbuilder

WORKDIR /app

ENV GRPC_HOST=0.0.0.0:50052

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    gcc cmake libc6 npm

RUN npm install @a11ywatch/protos

COPY . .

RUN cargo install --no-default-features --path .

FROM --platform=$BUILDPLATFORM node:17.8-alpine3.14 AS BUILD_IMAGE

ENV CHROME_BIN="/usr/bin/chromium-browser" \
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

WORKDIR /usr/src/app

COPY . .

RUN npm ci
RUN npm run build
RUN rm -R ./node_modules
RUN npm install --production

# final image
FROM --platform=$BUILDPLATFORM node:17-buster-slim

ENV NODE_ENV="production"

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules
COPY --from=rustbuilder /usr/local/cargo/bin/health_client /usr/local/bin/health_client

EXPOSE 50052

CMD [ "node", "./dist/server.js"]

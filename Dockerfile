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
FROM node:17.8-alpine3.14

ENV NODE_ENV="production"

RUN apk upgrade --update-cache --available && \
	apk add openssl curl && \
	rm -rf /var/cache/apk/*

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

CMD [ "node", "./dist/server.js"]

FROM --platform=$BUILDPLATFORM node:17.8-alpine3.14 AS BUILD_IMAGE

ENV CHROME_BIN="/usr/bin/chromium-browser" \
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN  npm run build

FROM node:17.8-alpine3.14

ENV CHROME_BIN="/usr/bin/chromium-browser" \
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true" \
	NODE_ENV="production"

RUN set -x \
	&& apk update \
	&& apk upgrade \
	&& apk add --no-cache \
	curl
    
WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist

COPY package*.json ./

RUN npm install --production

CMD [ "node", "./dist/server.js"]

FROM node:14.7.0-alpine AS BUILD_IMAGE

ENV CHROME_BIN="/usr/bin/chromium-browser" \
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN  npm run build

FROM node:14.7.0-alpine

ENV CHROME_BIN="/usr/bin/chromium-browser" \
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"

RUN set -x \
	&& apk update \
	&& apk upgrade \
	&& apk add --no-cache \
	udev \
	bash \
	ttf-freefont \
	chromium \
	python3 \
	make \
	g++ \
	jpeg-dev \
	cairo-dev \
	giflib-dev \
	pango-dev
    
WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

USER node

CMD [ "node", "./dist/server.js"]

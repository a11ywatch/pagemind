FROM jeffmendez19/puppateer-node-light AS BUILD_IMAGE

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN  npm run build

FROM jeffmendez19/puppateer-node-light

WORKDIR /usr/src/app

COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

USER node

CMD [ "node", "./dist/server.js"]

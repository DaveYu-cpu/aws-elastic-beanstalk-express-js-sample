FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY app.js ./

ENV NODE_ENV=production

EXPOSE 8080

USER node

CMD ["node", "app.js"]

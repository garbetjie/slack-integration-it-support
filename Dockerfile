FROM node:10.5-alpine

COPY .env index.js package.json package-lock.json /srv/
WORKDIR /srv
ENTRYPOINT ["node", "/srv/index.js"]
RUN npm install

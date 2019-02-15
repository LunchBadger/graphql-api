FROM node:alpine
RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app
ENV NODE_ENV production
COPY package.json package-lock.json /usr/src/app/
RUN npm install

COPY . /usr/src/app
EXPOSE 4000

CMD [ "npm", "run", "start:server" ]

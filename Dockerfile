FROM mhart/alpine-node:latest

RUN apk add --no-cache gcc g++ make python
RUN npm i -g npm node-gyp npx

COPY . /app
WORKDIR /app

RUN npm install --production
RUN apk del make gcc g++ python

RUN npm run init

EXPOSE 3000 3003/udp
ENTRYPOINT ["/bin/sh"]
CMD ["-c", "npm run start"]


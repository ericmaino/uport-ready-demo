FROM node:9.2.1

WORKDIR /home/worker
COPY package*.json ./
RUN npm install --production

COPY release ./
COPY config ./config
COPY demo ./demo

ENTRYPOINT [ "/bin/bash" ]

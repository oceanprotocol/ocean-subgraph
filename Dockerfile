FROM node:16

COPY package*.json /usr/src/app/
WORKDIR /usr/src/app
RUN npm install 

COPY . /usr/src/app
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]
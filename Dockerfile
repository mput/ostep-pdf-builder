FROM node:10
RUN npm i -g npm
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y sqlite3 libsqlite3-dev
RUN apt-get install -yq libsqlite3-0
RUN apt-get install -yq postgresql-client
WORKDIR /code

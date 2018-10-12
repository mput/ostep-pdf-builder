FROM node:10
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y pdftk
COPY . /code
WORKDIR /code
RUN npm install
RUN npm run build
RUN npm link
RUN mkdir /data
WORKDIR /data
CMD ostep-load

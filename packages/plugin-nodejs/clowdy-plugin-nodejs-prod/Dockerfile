FROM node:10-alpine
RUN apk add --update make gcc g++ python jq
WORKDIR /usr/src/app
COPY package.json .
RUN yarn install
COPY . .
RUN \
  ([ $(cat package.json | jq .scripts.build) = "null" ] || yarn build) && \
  (find . -name node_modules | xargs rm -rf) && \
  yarn install --production

FROM node:10-alpine
COPY --from=0 /usr/src/app /usr/src/app
WORKDIR /usr/src/app
CMD [ "yarn", "start" ]

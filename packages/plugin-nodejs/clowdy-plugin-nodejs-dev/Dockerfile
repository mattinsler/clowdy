FROM node:10-alpine
RUN apk add --update make gcc g++ python
WORKDIR /src
COPY package.json .
RUN yarn install
COPY . .
RUN \
  yarn build && \
  cp package.json dist/ && \
  cd dist && \
  yarn install --production

FROM node:10-alpine
RUN apk add --update make gcc g++ python
COPY --from=0 /src/dist /entrypoint
WORKDIR /usr/src/app
ENTRYPOINT [ "node", "/entrypoint" ]

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk --no-cache add g++ make python3 git && yarn global add node-gyp@9.4.0
ADD package.json yarn.lock /app/
RUN yarn --pure-lockfile
ADD . /app
RUN yarn build
RUN yarn --pure-lockfile --prod

FROM node:20-alpine
WORKDIR /app
RUN apk --no-cache add curl
COPY --from=builder /app .
CMD ["yarn", "start"]

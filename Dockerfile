FROM nginx:alpine

RUN apk add --no-cache --repository http://nl.alpinelinux.org/alpine/edge/main libuv \
    && apk add --no-cache --update-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/main nodejs npm

RUN apk add --no-cache openssh-client libc6-compat make git
# RUN ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2

ADD package.json /app/
RUN cd /app && npm i --no-audit

WORKDIR /app
ADD . /app/

ARG SOURCE_VERSION=HEAD
ARG RENDER_GIT_COMMIT=$SOURCE_VERSION
RUN make dist SOURCE_VERSION=$RENDER_GIT_COMMIT
RUN cp -r build/* /usr/share/nginx/html/

ADD config/* /etc/nginx/
RUN nginx -t
EXPOSE 8080

CMD ["/app/start.sh"]

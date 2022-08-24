#!/bin/sh

node . &
nodejs_proc=$!

nginx-debug -g "daemon off;" &
nginx_proc=$!

wait $nodejs_proc $nginx_proc

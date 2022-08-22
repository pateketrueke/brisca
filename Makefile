SOURCE_VERSION ?= $(shell git rev-parse --short=7 HEAD)
NODE_ENV ?= development
PWD=$(shell pwd)

export NODE_ENV SOURCE_VERSION

.PHONY: build

dev: deps
	@npm run dev

test: deps
	@npm run check

dist: deps
	@NODE_ENV=production npm run dist -- $(DIST_FLAGS)

deps:
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

clean:
	@rm -rf build cache.json

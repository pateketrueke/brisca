SOURCE_VERSION ?= $(shell git rev-parse --short=7 HEAD)
NODE_ENV ?= development
PWD=$(shell pwd)

ifneq ($(wildcard .env),)
	include .env
endif

.EXPORT_ALL_VARIABLES:

.PHONY: build

ci: deps
	@npm test

dev: stop deps
	@npm run dev & npm run watch -- .

test: deps
	@npm test

dist: deps
	@NODE_ENV=production npm run dist -- $(DIST_FLAGS)

stop:
	@fkill -s :8080 :3001

deps:
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

clean:
	@rm -rf build cache.json

build:
	@docker build --build-arg SOURCE_VERSION -t brisca .

start:
	@docker run -p 8085:8080 brisca

migrate:
	@npx drizzle-kit generate:sqlite --out=api/database/migrations --schema=api/database/schema.js

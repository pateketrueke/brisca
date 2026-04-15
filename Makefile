# defaults
src := build
from := next
target := gh-pages
message := Release: $(shell date)

GIT_REVISION ?= $(shell git rev-parse --short=7 HEAD)
NODE_ENV ?= development
PWD=$(shell pwd)

ifneq ($(wildcard .env),)
	include .env
endif

.EXPORT_ALL_VARIABLES:

define iif
  @(($(1) > /dev/null 2>&1) && echo "$(2)") || echo "$(3)"
endef

.PHONY: build pages deploy

ci: deps
	@npm test

dev: deps
	@npm run dev

test: deps
	@npm test

dist: deps
	@(git worktree remove $(src) --force > /dev/null 2>&1) || true
	@git worktree add $(src) $(target)
	@NODE_ENV=production npx vite build

deps:
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

clean:
	@$(call iif,rm -r $(src),Built artifacts were deleted,Artifacts already deleted)

pages: clean dist
deploy:
	@cd $(src) && git add --all && git commit -m "$(message)"
	@git push origin $(target) -f

build:
	@docker build --build-arg SOURCE_VERSION -t brisca .

start:
	@docker run -p 8085:8080 brisca

migrate:
	@npx drizzle-kit generate:sqlite --out=api/database/migrations --schema=api/database/schema.js

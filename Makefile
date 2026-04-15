# defaults
src := build
from := next
target := gh-pages
message := Release: $(shell date)

ifneq ($(wildcard .env),)
	include .env
endif

.EXPORT_ALL_VARIABLES:

define iif
  @(($(1) > /dev/null 2>&1) && echo "$(2)") || echo "$(3)"
endef

.PHONY: pages deploy

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
	@rm -rf $(src)/* && cp -r dist/www/* $(src)/
	@echo "ba.soypache.co" > $(src)/CNAME
	@touch $(src)/.nojekyll

deps:
	@(((ls node_modules | grep .) > /dev/null 2>&1) || npm i) || true

clean:
	@$(call iif,rm -r $(src),Built artifacts were deleted,Artifacts already deleted)

pages: clean dist
deploy: $(src)
	@cd $(src) && git add --all && git commit -m "$(message)"
	@git push origin $(target) -f

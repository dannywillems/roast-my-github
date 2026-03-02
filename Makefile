.PHONY: help
help: ## Ask for help!
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		sort | \
		awk 'BEGIN {FS = ":.*?## "}; \
		{printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: dev
dev: ## Run SvelteKit dev server
	npx vite dev

.PHONY: build
build: ## Build for production
	npx vite build

.PHONY: preview
preview: ## Preview production build
	npx vite preview

.PHONY: typecheck
typecheck: ## Run svelte-check type checker
	npx svelte-check --tsconfig ./tsconfig.json

.PHONY: check-format
check-format: ## Check formatting
	npx prettier --check .

.PHONY: format
format: ## Format code
	npx prettier --write .

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf build .svelte-kit

.PHONY: run build test lint fmt tidy docker-up docker-down deploy docs-serve docs-build docs-build-public docs-build-internal

run:            ## start the server (needs a reachable Postgres)
	go run ./cmd/server

build:          ## compile the server binary to ./bin
	go build -o bin/server ./cmd/server

test:           ## run tests
	go test ./...

lint:           ## run golangci-lint
	golangci-lint run

fmt:            ## auto-format (gofumpt + goimports)
	golangci-lint fmt

tidy:           ## sync go.mod / go.sum
	go mod tidy

docker-up:      ## build + start api and postgres locally
	docker compose up --build

docker-down:    ## stop and remove local containers
	docker compose down

deploy:         ## build, push to ECR, redeploy App Runner
	./scripts/deploy.sh

docs-serve:     ## live-preview the docs portal (setup: pip install -r requirements-docs.txt)
	mkdocs serve

docs-build:     ## strict build — full site (all visibility tiers; local/private)
	mkdocs build --strict

docs-build-public:   ## strict build — public docs only (the public site)
	DOCS_AUDIENCE=public mkdocs build --strict --site-dir site-public

docs-build-internal: ## strict build — public + internal docs (the auth-gated site)
	DOCS_AUDIENCE=internal mkdocs build --strict --site-dir site-internal

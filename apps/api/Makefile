.PHONY: run build test lint fmt tidy docker-up docker-down deploy

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

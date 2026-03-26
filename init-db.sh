#!/bin/sh
set -e

echo "Initializing databases..."

docker compose run --rm auth-service npm run db:push
docker compose run --rm user-service npm run db:push
docker compose run --rm event-service npm run db:push
docker compose run --rm ticket-service npm run db:push
docker compose run --rm payment-service npm run db:push
docker compose run --rm logger-service npm run db:push

echo "Databases initialized."
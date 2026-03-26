#!/bin/bash

echo "Starting seed..."

echo "\n--- Seeding auth-service ---"
docker exec auth-service npx ts-node src/seed.ts
if [ $? -ne 0 ]; then
    echo "Auth-service seed failed"
    exit 1
fi

echo "\n--- Seeding user-service ---"
docker exec user-service npx ts-node src/seed.ts
if [ $? -ne 0 ]; then
    echo "User-service seed failed"
    exit 1
fi

echo "\nSeed complete!"
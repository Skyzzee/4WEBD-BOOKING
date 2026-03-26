#!/bin/bash
services=("auth-service" "event-service" "notification-service" "payment-service" "ticket-service" "user-service", "logger-service")

for service in "${services[@]}"; do
    echo "Running tests in $service..."
    cd $service && npm test && cd ..
    if [ $? -ne 0 ]; then
        echo "Tests failed in $service"
        exit 1
    fi
done

echo "All tests passed!"
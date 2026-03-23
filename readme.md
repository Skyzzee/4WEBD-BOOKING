# 4WEBD Booking

A microservices-based ticketing system for concerts and events.

## Stack

- **Runtime**: Node.js / TypeScript
- **Framework**: Express
- **Database**: PostgreSQL (one per service)
- **ORM**: Prisma
- **Message Broker**: RabbitMQ
- **Payment**: Stripe
- **Reverse Proxy**: Nginx
- **Containerization**: Docker / Docker Compose

## Architecture

The system is composed of the following services:

| Service              | Description                        |
| -------------------- | ---------------------------------- |
| auth-service         | Authentication and user management |
| user-service         | User profile management            |
| event-service        | Event management                   |
| ticket-service       | Ticket purchasing and validation   |
| payment-service      | Payment processing via Stripe      |
| notification-service | Email notifications                |
| logger-service       | Logging                            |

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Clone the repository
2. Run the following command:

```bash
docker compose up --build
```

The API is accessible at `http://localhost:8080`.

## Running Tests

From the root of the project:

```bash
npm test
```

## API Documentation

Each service exposes its own Swagger UI documentation:

| Service  | URL                                     |
| -------- | --------------------------------------- |
| Auth     | http://localhost:8080/api/auth/docs     |
| Events   | http://localhost:8080/api/events/docs   |
| Payments | http://localhost:8080/api/payments/docs |
| Tickets  | http://localhost:8080/api/tickets/docs  |
| Users    | http://localhost:8080/api/users/docs    |

# Railway Ticketing System

This project is a microservice-based railway ticketing system designed to simulate a real-world transport flow:
    
    Users purchase tickets via a frontend UI,
    Tickets are validated at station gates,
    Internal services communicate securely behind an API gateway,
    Only the gateway and frontend are publicly accessible.,

## Backend Services (Private / Internal)

All backend services run on a private Docker network and are not directly accessible from the browser or the public internet.
Only the API Gateway exposes ports to the host machine.
    
    Why this matters
    Prevents direct access to sensitive logic
    Mirrors real-world zero-trust architectures
    Allows services to evolve independently
    Reduces attack surface

## Backend Services Overview

### 1 API Gateway (api-gateway-service)

Public-facing entry point for all client requests

    Responsibilities
    Routes requests to internal services,
    Enforces authentication and authorization,
    Separates user flows from internal service flows,
    Acts as a security boundary

Exposed port:
    3000 (accessible by frontend only)

    Example responsibilitie
    /auth/login,
    /tickets,
    /scan,
    /routes

### 2 Authentication Service (auth-service) 

Internal service – not publicly accessible 

    Responsibilities
    User authentication,
    Token generation (JWT),
    Credential validation

Access - Only reachable from API Gateway over the internal Docker network

### 3 Gate Scanner Service (gate-scanner-service)

Internal service – simulates physical station gates

    Responsibilities
    Receives scan requests from API Gateway,
    Validates tickets via Ticket Validation Service,
    Applies circuit breaker logic for resilience,
    Returns gate actions (OPEN / DENY)

    Security 
    Protected using an internal service token,
    Never exposed directly to frontend

### 4 Ticket Validation Service (ticket-validation-service)

Internal core domain service

    Responsibilities
    Ticket lifecycle management,
    Validity checks (route, expiry, usage),
    Idempotent ticket creation,
    Business rules enforcement

    Security:
    Only accepts requests from trusted internal services,
    Uses internal authentication headers,
    Not exposed outside the Docker network

## Internal Communication Model

    Internal services communicate using
    Private Docker network,
    Internal service URLs (e.g. http://ticket-validation-service:8080),
    Internal authentication tokens (via headers),
    No public ports exposed

    This ensures
    Clear trust boundaries,
    Strong separation of concerns,
    Production-style service isolation

## Frontend Service (Public)

Frontend (ticket-frontend)
User-facing React + Vite application

    Responsibilities
    Ticket purchase UI,
    Ticket wallet management,
    Gate simulation UI,
    User interaction only (no business logic)

    Access
    Runs on port 5173,
    Communicates only with API Gateway,
    Never talks directly to backend services

## Environment Configuration (.env)

This project uses a central .env file to configure environment-specific values for backend services.
The .env file is required to run the backend, but it is never committed to source control.

### Why a .env File Is Used

    In real systems, configuration is kept separate from code to ensure
    Secrets are not hardcoded,
    Different environments (dev / test / prod) can use different values,
    Services remain portable and container-friendly,
    Credentials can be rotated without code changes,

### What goes in .env 
Note values are examples only

    # ----------------------------------
    # Authentication
    # ----------------------------------
    JWT_SECRET=super-secret-dev-key
    JWT_EXPIRES_IN=1h

    # ----------------------------------
    # Internal service authentication
    # ----------------------------------
    INTERNAL_SERVICE_TOKEN=replace-with-secure-random-string

    # ----------------------------------
    # Internal service URLs
    # (Docker service names are used as hosts)
    # ----------------------------------
    AUTH_SERVICE_URL=http://auth-service:4000
    TICKET_VALIDATION_SERVICE_URL=http://ticket-validation-service:8080
    GATE_SCANNER_SERVICE_URL=http://gate-scanner:8090

    # ----------------------------------
    # API Gateway
    # ----------------------------------
    API_GATEWAY_PORT=3000

### Internal Service Security
Several backend services require an internal service token = INTERNAL_SERVICE_TOKEN=replace-with-secure-random-string

    This token is
    Shared only between trusted backend services
    Sent via HTTP headers (e.g. X-Internal-Token)
    Used to prevent unauthorised internal calls
    
    This ensures:
    Frontend clients cannot call internal services directly
    Only the API Gateway and trusted services can communicate internally




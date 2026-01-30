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
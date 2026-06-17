---
title: API Overview
description: Base URL, content types, and response conventions.
---

# API Overview

## Base URL

```
http://localhost:8191
```

Or wherever you've mapped `PORT_API` (default `8191`).

## Authentication

TRAWL has no authentication — all endpoints are open. Run it on a private network or behind a firewall if you need access control.

## Content type

All request and response bodies are JSON:

```http
Content-Type: application/json
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Pool status and uptime |
| `GET` | `/stats` | Public numbers for dashboards |
| `POST` | `/v1` | FlareSolverr v2 compatible |
| `POST` | `/scrape` | Native TRAWL API |

## Error responses

All error responses follow this shape:

```json
{ "error": "Human-readable message" }
```

HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (missing/invalid fields) |
| 503 | Browser pool initializing |
| 500 | Internal error |

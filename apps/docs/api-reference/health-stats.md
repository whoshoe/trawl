---
title: Health & Stats
description: GET /health and GET /stats — monitoring endpoints.
---

# Health & Stats

Both endpoints require no authentication and are safe to expose to monitoring tools.

---

## `GET /health`

Full system health check. Used by Docker Compose health checks and monitoring systems.

### Response

```json
{
  "status": "ok",
  "uptime": 3842,
  "redis": "ok",
  "pool": {
    "total": 5,
    "busy": 1,
    "available": 4,
    "restarts": 0,
    "avgRestarts": 0
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"ok"` | Always `"ok"` when the API is reachable |
| `uptime` | number | Seconds since the API process started |
| `redis` | `"ok"` or `"error"` | Whether the Redis PING succeeded |
| `pool.total` | number | Total browser instances in the pool |
| `pool.busy` | number | Browsers currently processing a request |
| `pool.available` | number | Browsers ready to accept a request |
| `pool.restarts` | number | Total browser restarts since worker boot |
| `pool.avgRestarts` | number | Average restarts per browser |

Pool stats are read directly from the browser pool. If the pool hasn't initialised yet, pool values will be zero.

### Curl

```bash
curl -s http://localhost:8191/health | jq
```

---

## `GET /stats`

Lightweight public stats for dashboards and landing pages.

### Response

```json
{
  "browsers": 5,
  "available": 4,
  "busy": 1,
  "restarts": 0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `browsers` | number | Total browser pool size |
| `available` | number | Idle browsers |
| `busy` | number | Browsers in use |
| `restarts` | number | Total browser restarts since startup |

### Curl

```bash
curl -s http://localhost:8191/stats | jq
```

### Prometheus / uptime monitoring

Point an uptime monitor (e.g. UptimeRobot, Uptime Kuma) at `/health`. A 200 response with `"status": "ok"` and `"redis": "ok"` confirms full operation.

For Prometheus, scrape `/stats` and parse the JSON — or add a `/metrics` endpoint as a future extension.

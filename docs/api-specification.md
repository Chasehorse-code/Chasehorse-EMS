# API specification

The backend exposes a minimal health contract:

`GET /api/v1/health` returns `200 OK`:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00Z"
}
```

The generated OpenAPI document is served by Springdoc at `/v3/api-docs` and
the interactive UI at `/swagger-ui.html`. Authentication, account approval,
task, evidence, verification, manager review, and wallet endpoints are not
implemented yet.


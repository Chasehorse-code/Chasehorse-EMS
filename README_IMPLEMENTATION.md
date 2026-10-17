# ChaseHorse implementation guide

The existing root application is a React + TypeScript + Vite admin dashboard. It currently contains demo data and does not authenticate users or call the backend.

## Repository areas
- `src/`: existing dashboard prototype (mock API).
- `backend/erp-api/`: Spring Boot API foundation.
- `database/migrations/`: RLS migration notes.
- `apps/mobile/`: Expo/React Native scaffold.
- `docs/API_CONTRACT.md`: available and planned API contract.

## Backend local setup
Requirements: Java 21 and Maven 3.9+.

Set server environment variables from `backend/erp-api/.env.example` in your local shell or secret manager. Do not commit real `.env` files. The datasource user should be a dedicated least-privilege application role, not the Supabase postgres superuser.

Run from `backend/erp-api`:
```bash
mvn test
mvn spring-boot:run
```

Health check: `GET http://localhost:8080/api/v1/health`.
Authenticated identity endpoint: `GET http://localhost:8080/api/v1/me` with a valid Supabase Auth access token.

Do not enable Flyway against the live database until the existing schema is inspected, a backup is taken, and the migration is reviewed.

## Mobile scaffold
```bash
cd apps/mobile
npm install
npx expo start
```

## Security status
The dashboard and mobile app are not yet fully connected to the API. Business endpoints, server-side role authorization, tested RLS and storage policies, real task workflows and wallet ledger transactions must be implemented before production use.
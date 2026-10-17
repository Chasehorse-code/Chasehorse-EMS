# ChaseHorse Admin Dashboard — Frontend Prototype

**Demo only.** React + TypeScript + Vite prototype. All data is fictional and held in browser memory (resets on refresh).

Not implemented: authentication (the role dropdown only changes what is displayed), AI verification (sample output is static), payments, wallet transactions, or any backend call.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
```

## Screens
Overview, Employees (approval status), Tasks (create/assign), Nearby tasks, Checklists (configurable), Photo evidence review (AI result shown separately from manager decision), Operations approval queue, Wallets (demo ledger). Navigation is role-based for Admin, Manager, Operations and Customer — a display aid, not security.

## Integrating a backend later
- `src/api/contract.ts` is the single API interface; `src/api/mockApi.ts` implements it with demo data.
- Add a REST implementation (see `src/api/httpClient.ts`) for the Spring Boot API and swap it in `src/api/index.ts`. Suggested routes are listed in `contract.ts`.
- Spring Boot must own authorization, state transitions and ledger writes. Supabase PostgreSQL/Storage sit behind it; never ship service-role keys in this app.
- Types in `src/types` are shaped to map onto future DTOs/tables.

## Status
Typecheck and production build pass. Verified with a headless-browser smoke test (all routes load, no console errors). No unit tests yet.

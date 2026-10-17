# Architecture

The planned system has three deployable surfaces:

1. Expo mobile client for employees.
2. React/Vite web client for administration and operations.
3. Spring Boot API as the trust boundary for identity, authorization, workflows,
   private evidence access, verification decisions, and wallet ledger writes.

Clients call the API using public configuration only. Secrets, storage
credentials, service-role keys, approval decisions, and wallet mutations remain
server-side. Object storage for evidence must use private buckets and
short-lived, server-issued access URLs.

The current repository implements only the API health endpoint and the initial
database foundation.


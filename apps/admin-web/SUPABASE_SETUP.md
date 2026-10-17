# Supabase setup for the existing Vite dashboard

This application is React + Vite, not Next.js. Do not copy Next.js `cookies()`, `@supabase/ssr` server helpers, or Next.js middleware into this app.

Install `@supabase/supabase-js` and configure these values in an untracked `.env.local` file:

```dotenv
VITE_SUPABASE_URL=https://phxybimufcrsnxfepiuz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Use Supabase Auth client-side for sign-in and session management. Protected business operations must use the Spring Boot API, which validates JWTs and enforces roles server-side. Never add a database password, Supabase secret key, or service-role key to Vite variables.

This is setup documentation; the current dashboard remains a mock-data prototype until its API implementation is connected and tested.
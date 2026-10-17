# ChaseHorse Mobile

Expo + React Native + TypeScript scaffold for the field-team app.

## Run locally
```bash
npm install
npx expo start
```

## Current status
The screen is a navigation/product foundation only. Supabase authentication, secure token storage, task discovery, evidence uploads and live API calls are not implemented yet. Do not use demo UI as a production workflow.

The mobile app must call the Spring Boot API for protected business operations. Never embed a database password, Supabase secret key or service-role key in the app.
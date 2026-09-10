# Deploy Circuit Daily on Railway

1. Create a Railway Postgres plugin and copy `DATABASE_URL`.
2. Set `SESSION_SECRET`, `SESSION_HTTPS_ONLY=true`, and `APP_URL`.
3. Build with `npm run build` and start with `node dist/main.js`.
4. Never commit `.env`.

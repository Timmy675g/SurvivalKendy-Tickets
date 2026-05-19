# SurvivalKendy Tickets

Production-ready MVP support portal for the SurvivalKendy Minecraft server, intended for `tickets.survivalkendy.systems`.

## Stack

- React + Vite frontend
- Tailwind CSS with shadcn/ui-style local components
- Framer Motion page and card transitions
- Node.js + Express backend
- MariaDB persistence
- Discord webhook notifications for Low, Medium, and High tickets
- Datadog On-Call paging for Critical tickets only

## Setup

```bash
npm install
cp .env.example .env
```

Create the MariaDB schema:

```bash
mysql -u root -p < database/schema.sql
```

Edit `.env` with database credentials, admin credentials, and notification secrets.

## Development

```bash
npm run dev
```

Defaults:

- Frontend: `http://localhost:5006`
- Backend API: `http://localhost:5007`

Both ports are configurable with `FRONTEND_PORT` and `BACKEND_PORT`.

## Production

Build and run:

```bash
npm run build
NODE_ENV=production npm run start:api
npm run preview
```

For PM2:

```bash
pm2 start server/index.js --name survivalkendy-tickets-api --env production
pm2 start "npm run preview" --name survivalkendy-tickets-web
pm2 save
```

Set `NODE_ENV=production`, `FRONTEND_ORIGIN=https://tickets.survivalkendy.systems`, secure admin credentials, and a long `SESSION_SECRET` in the PM2 environment.

## NGINX

Use `deploy/nginx-survivalkendy-tickets.conf` as the reverse proxy example:

- `tickets.survivalkendy.systems/` -> `localhost:5006`
- `tickets.survivalkendy.systems/api/` -> `localhost:5007`

Add TLS with Certbot or your existing certificate automation.

## Environment

Required backend variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Optional notifications:

- `DISCORD_WEBHOOK_URL`
- `DATADOG_API_KEY`
- `DATADOG_APP_KEY`
- `DATADOG_ONCALL_TEAM`
- `DATADOG_SITE`

`DATADOG_SITE` accepts common Datadog sites such as `datadoghq.com`, `us3.datadoghq.com`, `us5.datadoghq.com`, `datadoghq.eu`, `ap1.datadoghq.com`, and `ap2.datadoghq.com`. You can also provide a full Datadog On-Call base URL.

## Security Notes

- Ticket submissions are validated with Zod and rate limited.
- Helmet is enabled for baseline HTTP hardening.
- CORS is restricted to `FRONTEND_ORIGIN` and uses credentials only for admin APIs.
- Admin sessions are HTTP-only cookies and become `secure` when `NODE_ENV=production`.
- Datadog and Discord secrets are never exposed to the frontend.
- Production errors do not expose stack traces or raw exception details.

## API

Public:

- `POST /api/tickets`

Admin:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/tickets`
- `GET /api/admin/tickets/:ticketId`
- `PATCH /api/admin/tickets/:ticketId/status`
- `POST /api/admin/tickets/:ticketId/notes`

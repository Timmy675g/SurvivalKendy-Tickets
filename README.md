# SurvivalKendy Tickets Archive

Archived support portal for the SurvivalKendy Minecraft server.

This project is no longer an active ticketing service. Public ticket submission, admin ticket operations, Cloudflare
Worker AI classification, Discord notifications, and Datadog paging are disabled. The repository remains available for
historical reference only.

## Stack

- React + Vite frontend
- Tailwind CSS with shadcn/ui-style local components
- Framer Motion page and card transitions
- Node.js + Express backend
- MariaDB persistence
- Cloudflare Workers AI severity classification
- Discord webhook notifications for Low, Medium, and High tickets
- Datadog On-Call paging for AI-classified Critical tickets only

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

For existing databases, apply the additive migration after deploying the new backend code:

```bash
mysql -u root -p < database/migrations/20260519_ai_severity.sql
```

## Development

```bash
npm run dev
```

Defaults:

- Frontend: `http://localhost:5006`
- Backend API: `http://localhost:5007`

Both ports are configurable with `FRONTEND_PORT` and `BACKEND_PORT`.

The backend keeps `/api/health` available for deployment checks. All other `/api` routes return `410 Gone` in archive mode.

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

Set `NODE_ENV=production` and `FRONTEND_ORIGIN=https://tickets.survivalkendy.systems` if hosting the archive. Ticket
creation, admin actions, Worker classification, and notifications remain disabled by the backend.

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

Retired notification variables:

- `DISCORD_WEBHOOK_URL`
- `WORKER_AI_URL`
- `WORKER_SECRET`
- `DATADOG_API_KEY`
- `DATADOG_APP_KEY`
- `DATADOG_ONCALL_TEAM`
- `DATADOG_SITE`
- `DATADOG_WORKFLOW_WEBHOOK_URL`
- `DATADOG_NOTIFICATION_MODE`
- `DATADOG_NOTIFICATION_DEBUG`

These variables are retained in `.env.example` for historical context, but the archive backend does not invoke
Cloudflare Worker, Discord, Datadog On-Call, or Datadog Workflow notification paths.

Historical AI and paging variables:

```env
WORKER_AI_URL=
WORKER_SECRET=
DATADOG_API_KEY=
DATADOG_APP_KEY=
DATADOG_ONCALL_TEAM=
DATADOG_SITE=us5.datadoghq.com
DATADOG_WORKFLOW_WEBHOOK_URL=
DATADOG_NOTIFICATION_MODE=direct
DATADOG_NOTIFICATION_DEBUG=false
```

Archive mode prevents new ticket creation before classification or notification logic can run.

## Cloudflare Worker

Worker code lives in `worker/` for reference only. The archive backend does not call the Worker.

```bash
cd worker
npm install -g wrangler
wrangler login
cp wrangler.toml.example wrangler.toml
wrangler secret put WORKER_SECRET
wrangler deploy
```

The Worker uses the Workers AI binding:

```toml
[ai]
binding = "AI"
```

Worker deployment is not required for the archived site.

## Security Notes

- Ticket submission and admin mutation routes return `410 Gone`.
- Helmet is enabled for baseline HTTP hardening.
- CORS is restricted to `FRONTEND_ORIGIN` and uses credentials only for admin APIs.
- Admin sessions are HTTP-only cookies and become `secure` when `NODE_ENV=production`.
- Cloudflare Worker, Datadog, and Discord secrets are never exposed to the frontend.
- The archive backend does not call external classification or notification services.
- Production errors do not expose stack traces or raw exception details.

## API

- `GET /api/health` returns service health with `archived: true`.
- All other `/api` routes return `410 Gone`.
- No public submission, admin, Worker, Discord, or Datadog endpoints are active in archive mode.

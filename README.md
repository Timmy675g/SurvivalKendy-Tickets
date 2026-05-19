# SurvivalKendy Tickets

Production-ready MVP support portal for the SurvivalKendy Minecraft server, intended for `tickets.survivalkendy.systems`.

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
- `WORKER_AI_URL`
- `WORKER_SECRET`
- `DATADOG_API_KEY`
- `DATADOG_APP_KEY`
- `DATADOG_ONCALL_TEAM`
- `DATADOG_SITE`
- `DATADOG_WORKFLOW_WEBHOOK_URL`
- `DATADOG_NOTIFICATION_MODE`
- `DATADOG_NOTIFICATION_DEBUG`

`DATADOG_SITE` accepts common Datadog sites such as `datadoghq.com`, `us3.datadoghq.com`, `us5.datadoghq.com`, `datadoghq.eu`, `ap1.datadoghq.com`, and `ap2.datadoghq.com`. Datadog On-Call Paging URLs are built from this value; for `us5.datadoghq.com`, paging uses `https://navy.oncall.datadoghq.com/api/v2/on-call/pages`.

`DATADOG_NOTIFICATION_MODE` defaults to `direct`, which uses the On-Call Paging API and requires `DATADOG_API_KEY`, `DATADOG_APP_KEY`, and `DATADOG_ONCALL_TEAM`. Set it to `workflow` to send Critical ticket details to `DATADOG_WORKFLOW_WEBHOOK_URL` instead.

If `DATADOG_WORKFLOW_WEBHOOK_URL` is a Datadog Workflow Automation API endpoint such as `https://api.datadoghq.com/api/v2/workflows/{workflow_id}/instances`, the backend sends `DD-API-KEY` and `DD-APPLICATION-KEY` and wraps the ticket details in `meta.payload`, as required by Datadog's execute workflow API. Plain webhook URLs receive the ticket details as a flat JSON payload.

The Datadog application key used for paging must be allowed to page On-Call targets. In Datadog RBAC this permission is `on_call_page`.

`DATADOG_ONCALL_TEAM` should be the raw Datadog team handle, for example `survivalkendy-pagers-team`. If it is accidentally configured as `@oncall-survivalkendy-pagers-team`, the backend strips the mention prefix before sending `target.identifier`.

Set `DATADOG_NOTIFICATION_DEBUG=true` temporarily to log sanitized request URLs, payloads, response statuses, and response bodies while diagnosing paging failures. Do not leave it enabled longer than needed.

Example AI and paging variables:

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

If the Worker call fails or is not configured, the backend stores AI severity as `Medium`. User-provided impact and urgency never trigger Datadog directly.

## Cloudflare Worker

Worker code lives in `worker/`.

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

After deploy, set `WORKER_AI_URL` in the backend `.env` to the Worker `/classify` endpoint and set backend `WORKER_SECRET` to the same secret stored with `wrangler secret put WORKER_SECRET`.

## Security Notes

- Ticket submissions are validated with Zod and rate limited.
- Helmet is enabled for baseline HTTP hardening.
- CORS is restricted to `FRONTEND_ORIGIN` and uses credentials only for admin APIs.
- Admin sessions are HTTP-only cookies and become `secure` when `NODE_ENV=production`.
- Cloudflare Worker, Datadog, and Discord secrets are never exposed to the frontend.
- The Worker requires `X-SURVIVALKENDY-WORKER-SECRET` from the Express backend.
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
- `PATCH /api/admin/tickets/:ticketId/priority`
- `POST /api/admin/tickets/:ticketId/notes`

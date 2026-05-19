# SurvivalKendy Ticket Classifier Worker

Cloudflare Worker endpoint for Workers AI severity classification.

## Setup

1. Install Wrangler and log in:

```bash
npm install -g wrangler
wrangler login
```

1. Copy the Wrangler example:

```bash
cp wrangler.toml.example wrangler.toml
```

1. Set the shared secret as a Worker secret:

```bash
wrangler secret put WORKER_SECRET
```

Use the same value for `WORKER_SECRET` in the Express backend `.env`.

1. Enable the Workers AI binding in `wrangler.toml`:

```toml
[ai]
binding = "AI"
```

1. Deploy:

```bash
wrangler deploy
```

1. Set the backend URL:

```env
WORKER_AI_URL=https://survivalkendy-ticket-classifier.<your-subdomain>.workers.dev/classify
WORKER_SECRET=<same-secret-used-in-worker>
```

The Worker requires the `X-SURVIVALKENDY-WORKER-SECRET` header. Do not expose the Worker secret, Datadog keys, or Discord webhook URL to the frontend.

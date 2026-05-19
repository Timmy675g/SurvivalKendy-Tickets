import React from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  LogOut,
  MessageSquarePlus,
  ShieldCheck,
  Swords,
  Ticket,
  UserRound
} from "lucide-react";
import "./index.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const categories = ["Bug", "Lag / Performance", "Lost Items", "Player Report", "Appeal", "Suggestion", "Other"];
const priorities = ["Low", "Medium", "High", "Critical"];
const statuses = ["Open", "In Progress", "Resolved"];

const api = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Request failed." }));
      throw new Error(payload.error || "Request failed.");
    }

    if (response.status === 204) return null;
    return response.json();
  },
  createTicket(data) {
    return this.request("/api/tickets", { method: "POST", body: JSON.stringify(data) });
  },
  session() {
    return this.request("/api/admin/session");
  },
  login(data) {
    return this.request("/api/admin/login", { method: "POST", body: JSON.stringify(data) });
  },
  logout() {
    return this.request("/api/admin/logout", { method: "POST" });
  },
  tickets(filters) {
    const params = new URLSearchParams(filters);
    return this.request(`/api/admin/tickets?${params}`);
  },
  ticket(ticketId) {
    return this.request(`/api/admin/tickets/${ticketId}`);
  },
  updateStatus(ticketId, status) {
    return this.request(`/api/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  },
  addNote(ticketId, note) {
    return this.request(`/api/admin/tickets/${ticketId}/notes`, {
      method: "POST",
      body: JSON.stringify({ note })
    });
  }
};

function App() {
  const [view, setView] = React.useState("submit");
  const [admin, setAdmin] = React.useState(null);

  React.useEffect(() => {
    api.session().then(({ admin: activeAdmin }) => setAdmin(activeAdmin)).catch(() => setAdmin(null));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(57,255,141,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,141,0.035)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_25%_0%,rgba(54,211,153,0.16),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(74,222,128,0.08),transparent_28%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <Header view={view} setView={setView} admin={admin} setAdmin={setAdmin} />
        <AnimatePresence mode="wait">
          {view === "admin" ? (
            <AdminPortal key="admin" admin={admin} setAdmin={setAdmin} />
          ) : (
            <TicketPortal key="submit" />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Header({ view, setView, admin, setAdmin }) {
  async function handleLogout() {
    await api.logout();
    setAdmin(null);
  }

  return (
    <header className="flex flex-col gap-4 rounded-lg border border-border/80 bg-card/70 p-4 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
      <button className="flex items-center gap-3 text-left" onClick={() => setView("submit")}>
        <span className="grid size-11 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary">
          <Swords />
        </span>
        <span>
          <span className="block text-lg font-semibold tracking-normal">SurvivalKendy Tickets</span>
          <span className="block text-sm text-muted-foreground">Minecraft server operations support</span>
        </span>
      </button>
      <nav className="flex flex-wrap items-center gap-2">
        <Button variant={view === "submit" ? "default" : "ghost"} onClick={() => setView("submit")}>
          <MessageSquarePlus data-icon="inline-start" />
          Submit
        </Button>
        <Button variant={view === "admin" ? "secondary" : "ghost"} onClick={() => setView("admin")}>
          <ShieldCheck data-icon="inline-start" />
          Admin
        </Button>
        {admin ? (
          <Button variant="outline" onClick={handleLogout}>
            <LogOut data-icon="inline-start" />
            Logout
          </Button>
        ) : null}
      </nav>
    </header>
  );
}

function TicketPortal() {
  const [result, setResult] = React.useState(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 py-3">
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal md:text-6xl">
            Submit a ticket for SurvivalKendy staff.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Send bug reports, appeals, lost item claims, and performance issues to the right team without exposing
            server operations tooling.
          </p>
        </section>
        <AnimatePresence mode="wait">
          {result ? <SuccessPanel ticket={result} onReset={() => setResult(null)} /> : <TicketForm onSuccess={setResult} />}
        </AnimatePresence>
      </div>
      <OpsPanel />
    </motion.section>
  );
}

function TicketForm({ onSuccess }) {
  const [form, setForm] = React.useState({
    minecraftUsername: "",
    title: "",
    category: "Bug",
    priority: "Medium",
    description: "",
    evidenceLink: "",
    website: ""
  });
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = await api.createTicket(form);
      onSuccess(payload.ticket);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onSubmit={submit}
    >
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket />
            Ticket submission
          </CardTitle>
          <CardDescription>Critical priority pages on-call. Low, Medium, and High route to Discord.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
          <div className="hidden">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={form.website} onChange={(event) => update("website", event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Minecraft username">
              <Input
                id="minecraftUsername"
                value={form.minecraftUsername}
                onChange={(event) => update("minecraftUsername", event.target.value)}
                placeholder="KendyCrafter"
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Title">
              <Input
                id="title"
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Chunks not loading near spawn"
                required
              />
            </Field>
            <Field label="Category">
              <Select id="category" value={form.category} onChange={(event) => update("category", event.target.value)}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select id="priority" value={form.priority} onChange={(event) => update("priority", event.target.value)}>
                {priorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Include coordinates, time, affected players, and what you expected to happen."
              rows={7}
              required
            />
          </Field>
          <Field label="Evidence link optional">
            <Input
              id="evidenceLink"
              value={form.evidenceLink}
              onChange={(event) => update("evidenceLink", event.target.value)}
              placeholder="https://imgur.com/... or https://youtu.be/..."
              type="url"
            />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Staff can see all ticket details and internal notes after login.</p>
            <Button type="submit" disabled={loading}>
              <MessageSquarePlus data-icon="inline-start" />
              {loading ? "Submitting..." : "Submit ticket"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.form>
  );
}

function SuccessPanel({ ticket, onReset }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
      <Card>
        <CardContent className="flex flex-col gap-5 p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 place-items-center rounded-md bg-primary/10 text-primary">
              <CheckCircle2 />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold tracking-normal">Ticket received</h2>
              <p className="text-muted-foreground">Share this ticket ID if staff asks for a reference.</p>
            </div>
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/10 p-5">
            <p className="text-sm text-muted-foreground">Ticket ID</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-primary">{ticket.ticketId}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Meta label="Status" value={ticket.status} />
            <Meta label="Priority" value={ticket.priority} />
            <Meta label="Category" value={ticket.category} />
          </div>
          <Button onClick={onReset} variant="secondary">
            Submit another ticket
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OpsPanel() {
  const rows = [
    ["Critical", "Datadog page", "Immediate"],
    ["High", "Discord alert", "Staff queue"],
    ["Medium", "Discord alert", "Normal queue"],
    ["Low", "Discord alert", "Backlog"]
  ];

  return (
    <aside className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity />
            Operations routing
          </CardTitle>
          <CardDescription>Priority controls where the incident goes after submission.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rows.map(([priority, route, detail]) => (
            <div key={priority} className="flex items-center justify-between rounded-md border border-border bg-secondary/45 p-3">
              <div>
                <p className="font-medium">{priority}</p>
                <p className="text-sm text-muted-foreground">{route}</p>
              </div>
              <Badge tone={priority}>{detail}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList />
            Staff workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>Open tickets stay visible until a staff member changes status.</p>
          <p>Internal notes never appear on the public submission success screen.</p>
          <p>Datadog and Discord keys are read only by the backend process.</p>
        </CardContent>
      </Card>
    </aside>
  );
}

function AdminPortal({ admin, setAdmin }) {
  if (!admin) return <AdminLogin setAdmin={setAdmin} />;
  return <AdminDashboard />;
}

function AdminLogin({ setAdmin }) {
  const [credentials, setCredentials] = React.useState({ username: "", password: "" });
  const [error, setError] = React.useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = await api.login(credentials);
      setAdmin(payload.admin);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck />
            Admin login
          </CardTitle>
          <CardDescription>Use the credentials configured in the backend environment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
            <Field label="Username">
              <Input
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit">
              <UserRound data-icon="inline-start" />
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.section>
  );
}

function AdminDashboard() {
  const [filters, setFilters] = React.useState({ status: "All", priority: "All", category: "All" });
  const [tickets, setTickets] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState("");

  const loadTickets = React.useCallback(async () => {
    try {
      const payload = await api.tickets(filters);
      setTickets(payload.tickets);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [filters]);

  React.useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function openTicket(ticketId) {
    const payload = await api.ticket(ticketId);
    setSelected(payload.ticket);
  }

  async function changeStatus(ticketId, status) {
    await api.updateStatus(ticketId, status);
    await loadTickets();
    if (selected?.ticket_id === ticketId) await openTicket(ticketId);
  }

  async function submitNote(event) {
    event.preventDefault();
    if (!selected) return;
    await api.addNote(selected.ticket_id, note);
    setNote("");
    await openTicket(selected.ticket_id);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList />
            Admin Dashboard
          </CardTitle>
          <CardDescription>Review tickets, filter queue pressure, and move work through resolution.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <FilterSelect label="Status" value={filters.status} values={["All", ...statuses]} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
            <FilterSelect label="Priority" value={filters.priority} values={["All", ...priorities]} onChange={(value) => setFilters((current) => ({ ...current, priority: value }))} />
            <FilterSelect label="Category" value={filters.category} values={["All", ...categories]} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
          </div>
          {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[128px_1fr_132px_116px_126px] bg-secondary/70 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground max-lg:hidden">
              <span>ID</span>
              <span>Title</span>
              <span>Category</span>
              <span>Priority</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-border">
              {tickets.length ? (
                tickets.map((ticket) => (
                  <button
                    key={ticket.ticket_id}
                    onClick={() => openTicket(ticket.ticket_id)}
                    className="grid w-full gap-2 px-4 py-4 text-left transition hover:bg-secondary/55 lg:grid-cols-[128px_1fr_132px_116px_126px] lg:items-center"
                  >
                    <span className="font-mono text-sm text-primary">{ticket.ticket_id}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{ticket.title}</span>
                      <span className="block text-sm text-muted-foreground">{ticket.minecraft_username}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">{ticket.category}</span>
                    <Badge tone={ticket.priority}>{ticket.priority}</Badge>
                    <Badge tone={ticket.status}>{ticket.status}</Badge>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">No tickets match these filters.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle />
            Ticket detail
          </CardTitle>
          <CardDescription>Update status and keep internal staff notes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {selected ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="font-mono text-sm text-primary">{selected.ticket_id}</p>
                <h2 className="text-xl font-semibold tracking-normal">{selected.title}</h2>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
                {selected.evidence_link ? (
                  <a className="text-sm text-primary underline-offset-4 hover:underline" href={selected.evidence_link} target="_blank" rel="noreferrer">
                    Evidence link
                  </a>
                ) : null}
              </div>
              <FilterSelect label="Status" value={selected.status} values={statuses} onChange={(value) => changeStatus(selected.ticket_id, value)} />
              <form className="flex flex-col gap-3" onSubmit={submitNote}>
                <Field label="Internal notes">
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add staff context or next action." rows={4} />
                </Field>
                <Button type="submit" disabled={!note.trim()}>
                  Add note
                </Button>
              </form>
              <div className="flex flex-col gap-3">
                {(selected.notes || []).map((entry) => (
                  <div key={entry.id} className="rounded-md border border-border bg-secondary/45 p-3">
                    <p className="text-sm">{entry.note}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.created_by} · {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Select a ticket to inspect operational details.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </Select>
    </Field>
  );
}

function Meta({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-secondary/55 p-3">
      <p className="text-xs uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);

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
const impacts = ["Just me", "Multiple players", "Whole server"];
const urgencies = ["Can wait", "Annoying but playable", "Blocking gameplay", "Server is unusable"];
const statuses = ["Open", "In Progress", "Resolved"];

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(max-width: 767px)").matches
  );

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

const api = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "Request failed." }));
      throw Object.assign(new Error(payload.error || "Request failed."), {
        issues: payload.issues
      });
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
  updatePriority(ticketId, priority) {
    return this.request(`/api/admin/tickets/${ticketId}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ priority })
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
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(57,255,141,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,141,0.035)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_25%_0%,rgba(54,211,153,0.16),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(74,222,128,0.08),transparent_28%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-8 sm:px-6 sm:py-5 lg:px-8">
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
    <header className="flex flex-col gap-4 rounded-lg border border-border/80 bg-card/70 p-3 shadow-panel backdrop-blur sm:p-4 md:flex-row md:items-center md:justify-between">
      <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => setView("submit")}>
        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary sm:size-11">
          <Swords />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-semibold tracking-normal sm:text-lg">SurvivalKendy Tickets</span>
          <span className="block text-sm text-muted-foreground">Minecraft server operations support</span>
        </span>
      </button>
      <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Button className="w-full sm:w-auto" variant={view === "submit" ? "default" : "ghost"} onClick={() => setView("submit")}>
          <MessageSquarePlus data-icon="inline-start" />
          Submit
        </Button>
        <Button className="w-full sm:w-auto" variant={view === "admin" ? "secondary" : "ghost"} onClick={() => setView("admin")}>
          <ShieldCheck data-icon="inline-start" />
          Admin
        </Button>
        {admin ? (
          <Button className="col-span-2 w-full sm:w-auto" variant="outline" onClick={handleLogout}>
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
  const isMobile = useIsMobile();

  return (
    <motion.section
      initial={{ opacity: 0, y: isMobile ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isMobile ? 0 : -10 }}
      transition={{ duration: isMobile ? 0.18 : 0.35 }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 py-2 sm:py-3">
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-normal sm:text-4xl md:text-6xl">
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
  const isMobile = useIsMobile();
  const [form, setForm] = React.useState({
    minecraft_username: "",
    title: "",
    category: "Bug",
    user_impact: "Just me",
    user_urgency: "Can wait",
    description: "",
    evidence_link: "",
    website: ""
  });
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      const payload = await api.createTicket(form);
      onSuccess(payload.ticket);
    } catch (requestError) {
      setError(requestError.message);
      setFieldErrors(requestError.issues?.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  }

  const errorFor = (field) => fieldErrors[field]?.[0] || "";

  return (
    <motion.form
      initial={{ opacity: 0, scale: isMobile ? 1 : 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: isMobile ? 1 : 0.98 }}
      transition={{ duration: isMobile ? 0.18 : 0.3 }}
      onSubmit={submit}
    >
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket />
            Ticket submission
          </CardTitle>
          <CardDescription>Impact and urgency help staff triage without exposing operations paging controls.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
          <div className="hidden">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={form.website} onChange={(event) => update("website", event.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Minecraft username" error={errorFor("minecraft_username")}>
              <Input
                id="minecraft_username"
                value={form.minecraft_username}
                onChange={(event) => update("minecraft_username", event.target.value)}
                placeholder="KendyCrafter"
                autoComplete="username"
                required
              />
            </Field>
            <Field label="Title" error={errorFor("title")}>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Chunks not loading near spawn"
                required
              />
            </Field>
            <Field label="Category" error={errorFor("category")}>
              <Select id="category" value={form.category} onChange={(event) => update("category", event.target.value)}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
            </Field>
            <Field label="Impact" error={errorFor("user_impact")}>
              <Select id="user_impact" value={form.user_impact} onChange={(event) => update("user_impact", event.target.value)}>
                {impacts.map((impact) => (
                  <option key={impact}>{impact}</option>
                ))}
              </Select>
            </Field>
            <Field label="Urgency" error={errorFor("user_urgency")}>
              <Select id="user_urgency" value={form.user_urgency} onChange={(event) => update("user_urgency", event.target.value)}>
                {urgencies.map((urgency) => (
                  <option key={urgency}>{urgency}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Description" error={errorFor("description")}>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Include coordinates, time, affected players, and what you expected to happen."
              rows={7}
              required
            />
          </Field>
          <Field label="Evidence link optional" error={errorFor("evidence_link")}>
            <Input
              id="evidence_link"
              value={form.evidence_link}
              onChange={(event) => update("evidence_link", event.target.value)}
              placeholder="https://imgur.com/... or https://youtu.be/..."
              type="url"
            />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Staff can see all ticket details and internal notes after login.</p>
            <Button className="w-full sm:w-auto" type="submit" disabled={loading}>
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
  const isMobile = useIsMobile();

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isMobile ? 0 : -14 }}
      transition={{ duration: isMobile ? 0.18 : 0.3 }}
    >
      <Card>
        <CardContent className="flex flex-col gap-5 p-4 sm:p-7">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary sm:size-12">
              <CheckCircle2 />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-normal sm:text-2xl">Ticket received</h2>
              <p className="text-muted-foreground">Share this ticket ID if staff asks for a reference.</p>
            </div>
          </div>
          <div className="rounded-lg border border-primary/25 bg-primary/10 p-5">
            <p className="text-sm text-muted-foreground">Ticket ID</p>
            <p className="mt-1 break-all font-mono text-2xl font-semibold text-primary sm:text-3xl">{ticket.ticketId}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Meta label="Status" value={ticket.status} />
            <Meta label="Severity" value={ticket.severity} />
            <Meta label="Category" value={ticket.category} />
          </div>
          <Button className="w-full sm:w-auto" onClick={onReset} variant="secondary">
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
          <CardDescription>AI severity controls where the incident goes after backend classification.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rows.map(([priority, route, detail]) => (
            <div key={priority} className="flex flex-col gap-3 rounded-md border border-border bg-secondary/45 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{priority}</p>
                <p className="text-sm text-muted-foreground">{route}</p>
              </div>
              <Badge className="w-fit" tone={priority}>{detail}</Badge>
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
          <p>Cloudflare, Datadog, and Discord keys are read only by backend or Worker processes.</p>
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
  const isMobile = useIsMobile();

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
    <motion.section
      initial={{ opacity: 0, y: isMobile ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isMobile ? 0 : -10 }}
      transition={{ duration: isMobile ? 0.18 : 0.35 }}
    >
      <Card className="mx-auto w-full max-w-md">
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
            <Button className="w-full" type="submit">
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
  const isMobile = useIsMobile();

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

  async function changePriority(ticketId, priority) {
    await api.updatePriority(ticketId, priority);
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
      initial={{ opacity: 0, y: isMobile ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: isMobile ? 0 : -10 }}
      transition={{ duration: isMobile ? 0.18 : 0.35 }}
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
            <FilterSelect label="Severity" value={filters.priority} values={["All", ...priorities]} onChange={(value) => setFilters((current) => ({ ...current, priority: value }))} />
            <FilterSelect label="Category" value={filters.category} values={["All", ...categories]} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
          </div>
          {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[128px_1fr_132px_116px_126px] bg-secondary/70 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground max-lg:hidden">
              <span>ID</span>
              <span>Title</span>
              <span>Category</span>
              <span>Severity</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-border">
              {tickets.length ? (
                tickets.map((ticket) => (
                  <button
                    key={ticket.ticket_id}
                    onClick={() => openTicket(ticket.ticket_id)}
                    className="grid w-full gap-3 px-3 py-4 text-left transition hover:bg-secondary/55 sm:px-4 lg:grid-cols-[128px_1fr_132px_116px_126px] lg:items-center lg:gap-2"
                  >
                    <span className="flex min-w-0 flex-col gap-1 lg:block">
                      <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:hidden">ID</span>
                      <span className="break-all font-mono text-sm text-primary">{ticket.ticket_id}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:hidden">Ticket</span>
                      <span className="block break-words font-medium lg:truncate">{ticket.title}</span>
                      <span className="block text-sm text-muted-foreground">{ticket.minecraft_username}</span>
                    </span>
                    <span className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:contents">
                      <span className="flex flex-col gap-1 lg:block">
                        <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:hidden">Category</span>
                        <span className="text-sm text-muted-foreground">{ticket.category}</span>
                      </span>
                      <span className="flex flex-col gap-1 lg:block">
                        <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:hidden">Severity</span>
                        <Badge className="max-w-full" tone={ticket.admin_priority_override || ticket.ai_severity || ticket.priority}>
                          {ticket.admin_priority_override || ticket.ai_severity || ticket.priority}
                        </Badge>
                      </span>
                      <span className="flex flex-col gap-1 lg:block">
                        <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground lg:hidden">Status</span>
                        <Badge className="max-w-full" tone={ticket.status}>{ticket.status}</Badge>
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm leading-6 text-muted-foreground sm:p-8">No tickets match these filters.</div>
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
                <p className="break-all font-mono text-sm text-primary">{selected.ticket_id}</p>
                <h2 className="break-words text-lg font-semibold tracking-normal sm:text-xl">{selected.title}</h2>
                <p className="break-words text-sm leading-6 text-muted-foreground">{selected.description}</p>
                {selected.evidence_link ? (
                  <a className="break-all text-sm text-primary underline-offset-4 hover:underline" href={selected.evidence_link} target="_blank" rel="noreferrer">
                    Evidence link
                  </a>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Meta label="Impact" value={selected.user_impact} />
                <Meta label="Urgency" value={selected.user_urgency} />
                <Meta label="AI severity" value={selected.ai_severity} />
                <Meta label="Confidence" value={Number(selected.ai_confidence || 0).toFixed(2)} />
              </div>
              <div className="rounded-md border border-border bg-secondary/45 p-3">
                <p className="text-xs uppercase tracking-normal text-muted-foreground">AI reason</p>
                <p className="mt-1 break-words text-sm leading-6">{selected.ai_reason}</p>
              </div>
              <FilterSelect
                label="Admin priority override"
                value={selected.admin_priority_override || ""}
                values={["", ...priorities]}
                onChange={(value) => changePriority(selected.ticket_id, value)}
              />
              <FilterSelect label="Status" value={selected.status} values={statuses} onChange={(value) => changeStatus(selected.ticket_id, value)} />
              <form className="flex flex-col gap-3" onSubmit={submitNote}>
                <Field label="Internal notes">
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add staff context or next action." rows={4} />
                </Field>
                <Button className="w-full sm:w-auto" type="submit" disabled={!note.trim()}>
                  Add note
                </Button>
              </form>
              <div className="flex flex-col gap-3">
                {(selected.notes || []).map((entry) => (
                  <div key={entry.id} className="rounded-md border border-border bg-secondary/45 p-3">
                    <p className="break-words text-sm leading-6">{entry.note}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.created_by} · {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm leading-6 text-muted-foreground sm:p-8">
              Select a ticket to inspect operational details.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}

function Field({ label, children, error }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function FilterSelect({ label, value, values, onChange }) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map((item) => (
          <option key={item} value={item}>
            {item || "No override"}
          </option>
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

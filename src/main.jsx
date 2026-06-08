import React from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Archive, ClipboardList, MessageSquareOff, Swords } from "lucide-react";
import "./index.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const retiredSystems = [
  ["Tickets", "Public submission and ticket storage", "Closed"],
  ["Cloudflare AI", "Worker severity classification", "Disabled"],
  ["Datadog", "Workflow and on-call paging", "Disabled"],
  ["Discord", "Staff alert dispatch", "Disabled"]
];

const archiveNotes = [
  "This website is kept online only as a historical archive for the SurvivalKendy ticket portal.",
  "New support requests cannot be submitted here.",
  "The backend no longer creates tickets, invokes the Cloudflare Worker, or dispatches Datadog and Discord notifications."
];

function App() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(57,255,141,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,141,0.035)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_25%_0%,rgba(54,211,153,0.16),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(74,222,128,0.08),transparent_28%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 py-4 sm:gap-8 sm:px-6 sm:py-5 lg:px-8">
        <Header />
        <ArchivePortal />
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-4 rounded-lg border border-border/80 bg-card/70 p-3 shadow-panel backdrop-blur sm:p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-3 text-left">
        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary sm:size-11">
          <Swords />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-semibold tracking-normal sm:text-lg">SurvivalKendy Tickets Archive</span>
          <span className="block text-sm text-muted-foreground">Retired Minecraft server support portal</span>
        </span>
      </div>
      <Badge className="w-fit" tone="Resolved">
        Archived
      </Badge>
    </header>
  );
}

function ArchivePortal() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 py-2 sm:py-3">
          <p className="font-mono text-sm uppercase tracking-normal text-primary">Archive mode</p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-normal sm:text-4xl md:text-6xl">
            SurvivalKendy Tickets is archived.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            The public support portal, ticket backend, Cloudflare Worker classification, and Datadog or Discord
            notification systems have been retired.
          </p>
        </section>
        <ArchivePanel />
      </div>
      <ArchiveStatus />
    </motion.section>
  );
}

function ArchivePanel() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle />
          Ticket system disabled
        </CardTitle>
        <CardDescription>The form and API no longer accept new tickets.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3">
          {archiveNotes.map((note) => (
            <div key={note} className="rounded-md border border-border bg-secondary/45 p-4">
              <p className="text-sm leading-6 text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
        <Button className="w-full sm:w-fit" type="button" disabled>
          <MessageSquareOff data-icon="inline-start" />
          Ticket submissions closed
        </Button>
      </CardContent>
    </Card>
  );
}

function ArchiveStatus() {
  return (
    <aside className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity />
            Archive status
          </CardTitle>
          <CardDescription>Live support automation is no longer running.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {retiredSystems.map(([system, detail, state]) => (
            <div key={system} className="flex flex-col gap-3 rounded-md border border-border bg-secondary/45 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">{system}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
              <Badge className="w-fit" tone="Resolved">
                {state}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList />
            Backend behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            <code>/api/health</code> remains available for archive uptime checks.
          </p>
          <p>Every other API route returns archived status and does not touch the database or external services.</p>
          <p>Cloudflare, Datadog, and Discord credentials are not used by the archived backend.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive />
            Historical reference
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          <p>The project remains available as a record of the old SurvivalKendy support workflow.</p>
        </CardContent>
      </Card>
    </aside>
  );
}

createRoot(document.getElementById("root")).render(<App />);

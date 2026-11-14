"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Plus, ArrowUpRight, Calendar, Users, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { thekedarApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface EventSummary {
  id: number;
  title: string;
  status: string;
  expected_attendance: number;
  total_departments: number;
  approved_departments: number;
  created_at: string;
}

export default function ClubDashboardPage() {
  const { data: sessionData } = useSession();
  const [events, setEvents] = React.useState<EventSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    thekedarApi
      .getEvents()
      .then((data) => {
        if (isMounted) {
          // Format event data
          const formatted = (data || []).map((ev: any) => {
            const reqs = ev.department_requests || [];
            const approved = reqs.filter((r: any) => r.status === "APPROVED").length;
            return {
              id: ev.id,
              title: ev.title,
              status: ev.status,
              expected_attendance: ev.expected_attendance || 0,
              total_departments: ev.total_departments !== undefined ? ev.total_departments : reqs.length,
              approved_departments: ev.approved_departments !== undefined ? ev.approved_departments : approved,
              created_at: ev.created_at || new Date().toISOString(),
            };
          });
          setEvents(formatted);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || "Failed to load events from server.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const userName = sessionData?.user?.full_name || "Club Representative";
  const userEmail = sessionData?.user?.email || "club@college.edu";

  return (
    <AppShell userRole="STUDENT_CLUB" userName={userName} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight font-sans">
              My Event Requests
            </h1>
            <p className="text-xs text-muted font-mono mt-0.5">
              Track department approvals, slot allocations, and cryptographically verified letters
            </p>
          </div>
          <Link href="/club/events/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Event Request
            </Button>
          </Link>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="text-xs text-muted font-mono uppercase">Total Submitted</div>
            <div className="text-2xl font-semibold text-ink mt-1 font-mono">{events.length}</div>
            <div className="text-[11px] text-muted mt-1 font-sans">Registered student events</div>
          </div>
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="text-xs text-status-warning font-mono uppercase">Pending Reviews</div>
            <div className="text-2xl font-semibold text-status-warning mt-1 font-mono">
              {events.filter((e) => e.status === "PENDING" || e.status === "PARTIALLY_APPROVED").length}
            </div>
            <div className="text-[11px] text-muted mt-1 font-sans">Awaiting authority decision</div>
          </div>
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="text-xs text-status-success font-mono uppercase">Fully Approved</div>
            <div className="text-2xl font-semibold text-status-success mt-1 font-mono">
              {events.filter((e) => e.status === "APPROVED").length}
            </div>
            <div className="text-[11px] text-muted mt-1 font-sans">Official permission issued</div>
          </div>
        </div>

        {/* Events Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-ink font-mono uppercase tracking-wider">
              Submitted Requests
            </h2>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Expected Size</TableHead>
                <TableHead>Department Progress</TableHead>
                <TableHead>Overall Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted font-mono text-xs">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-signal-orange" />
                    Loading event requests from database...
                  </TableCell>
                </TableRow>
              )}

              {error && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-red-600 font-mono text-xs">
                    <AlertCircle className="w-4 h-4 inline mr-1.5" />
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted font-sans text-xs">
                    No event requests found. Click &quot;Create Event Request&quot; above to submit your first request.
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-mono text-xs text-muted">
                    EV-{ev.id.toString().padStart(4, "0")}
                  </TableCell>
                  <TableCell className="font-medium text-ink max-w-[260px] truncate">
                    {ev.title}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted">
                    {ev.created_at.slice(0, 10)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {ev.expected_attendance} pax
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-ink font-semibold">
                        {ev.approved_departments}/{ev.total_departments}
                      </span>
                      <span className="text-[11px] text-muted font-sans">
                        {ev.approved_departments === ev.total_departments
                          ? "Approved"
                          : "In Progress"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ev.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/club/events/${ev.id}`}
                      className="inline-flex items-center text-xs font-medium text-signal-orange hover:underline font-mono"
                    >
                      Inspect & Letters
                      <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}

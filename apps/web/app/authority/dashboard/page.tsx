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
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, Calendar, Building, Loader2 } from "lucide-react";
import { thekedarApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function AuthorityDashboardPage() {
  const { data: sessionData } = useSession();
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
  const [recentDecisions, setRecentDecisions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      thekedarApi.getPendingDepartmentRequests(),
      thekedarApi.getAuthorityDecisions().catch(() => []),
    ])
      .then(([pendingData, decisionsData]) => {
        if (isMounted) {
          const formatted = (pendingData || []).map((req: any) => {
            const firstItem = req.requested_items && req.requested_items[0];
            const timeStr = firstItem
              ? `${firstItem.start_time?.slice(0, 16).replace("T", " ")} to ${firstItem.end_time?.slice(11, 16)}`
              : "As requested in schedule";
            const venueName = firstItem?.resource_name || "Department Venue";
            const venueCode = firstItem?.resource_code || "VENUE";
            return {
              id: req.id,
              event_id: req.event_id,
              event_title: req.event_title || `Event #${req.event_id}`,
              organizer_name: req.organizer_name || "Club Representative",
              organizer_email: req.organizer_email || "club@college.edu",
              resource_name: venueName,
              resource_code: venueCode,
              requested_time: timeStr,
              version: req.current_version || 1,
              status: req.status || "PENDING",
              submitted_at: req.created_at ? req.created_at.slice(0, 10) : "Recent",
            };
          });
          setPendingRequests(formatted);
          setRecentDecisions(decisionsData || []);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || "Failed to load authorization queue from server.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const userName = sessionData?.user?.full_name || "Department Authority";
  const userEmail = sessionData?.user?.email || "authority@college.edu";

  return (
    <AppShell
      userRole="AUTHORITY"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-signal-orange" />
              <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight font-sans">
                {sessionData?.user?.department_id === 1 ? "Dean of Academic Affairs Console" : "Department Authority Console"}
              </h1>
            </div>
            <p className="text-xs text-muted font-mono mt-0.5">
              Review facility requests, resolve slot collisions, and issue cryptographically signed letters
            </p>
          </div>
          <Link href="/authority/resources">
            <Button variant="secondary">
              <Calendar className="w-4 h-4 mr-1.5" />
              Facility Schedule Timetable
            </Button>
          </Link>
        </div>

        {/* Priority Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="text-xs text-status-warning font-mono uppercase">Action Required</div>
            <div className="text-2xl font-semibold text-status-warning mt-1 font-mono">
              {pendingRequests.length} Pending
            </div>
            <div className="text-[11px] text-muted mt-1 font-sans">Awaiting your approval or correction</div>
          </div>
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="text-xs text-ink font-mono uppercase">Decisions Recorded</div>
            <div className="text-2xl font-semibold text-ink mt-1 font-mono">{recentDecisions.length} Decisions</div>
            <div className="text-[11px] text-muted mt-1 font-sans">Institutional approval log</div>
          </div>
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="text-xs text-status-success font-mono uppercase">Signed Letters Issued</div>
            <div className="text-2xl font-semibold text-status-success mt-1 font-mono">
              {recentDecisions.filter((d) => d.decision === "APPROVED").length} Active
            </div>
            <div className="text-[11px] text-muted mt-1 font-sans">Verified on Sepolia testnet</div>
          </div>
        </div>

        {/* Pending Requests Queue */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-ink font-mono uppercase tracking-wider">
              Pending Authorization Queue ({pendingRequests.length})
            </h2>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub-Request</TableHead>
                <TableHead>Event & Organizer</TableHead>
                <TableHead>Requested Venue</TableHead>
                <TableHead>Requested Slot Window</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted font-mono text-xs">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-signal-orange" />
                    Loading authorization queue from database...
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

              {!loading && !error && pendingRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted font-sans text-xs">
                    No pending facility requests in your department authorization queue.
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && pendingRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs text-muted">
                    REQ-{req.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-ink font-sans text-xs md:text-sm">
                      {req.event_title}
                    </div>
                    <div className="text-muted font-mono text-[11px] mt-0.5">
                      {req.organizer_name} ({req.organizer_email})
                    </div>
                  </TableCell>
                  <TableCell className="font-sans text-xs text-ink">
                    {req.resource_name} ({req.resource_code})
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted">
                    {req.requested_time}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className="px-1.5 py-0.5 bg-paper border border-border rounded-[2px]">
                      v{req.version}.0
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/authority/requests/${req.id}`}>
                      <Button variant="primary" size="sm">
                        Review & Decide
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Recent Decisions History Table */}
        <div className="space-y-3 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-ink font-mono uppercase tracking-wider">
              Recent Institutional Decisions
            </h2>
            <Link href="/authority/history" className="text-xs font-mono text-signal-orange hover:underline">
              View All History &rarr;
            </Link>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Decision ID</TableHead>
                <TableHead>Event Title</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Decided By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead className="text-right">Letter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDecisions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted font-sans text-xs">
                    No decisions recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {recentDecisions.map((dec) => (
                <TableRow key={dec.id}>
                  <TableCell className="font-mono text-xs text-muted">DEC-{dec.id}</TableCell>
                  <TableCell className="font-medium text-ink text-xs">{dec.event_title}</TableCell>
                  <TableCell className="text-xs text-muted font-sans">{dec.resource}</TableCell>
                  <TableCell className="text-xs text-muted font-mono">{dec.decided_by}</TableCell>
                  <TableCell className="text-xs text-muted font-mono">{dec.date}</TableCell>
                  <TableCell>
                    <StatusBadge status={dec.decision} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {dec.permission_letter_id ? (
                      <a
                        href={`http://localhost:8000/api/v1/documents/${dec.permission_letter_id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-signal-orange hover:underline font-semibold"
                      >
                        PDF
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
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

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
import { Clock, CheckCircle2, AlertCircle, ArrowUpRight, Calendar, Building } from "lucide-react";

export default function AuthorityDashboardPage() {
  const [pendingRequests, setPendingRequests] = React.useState([
    {
      id: 102,
      event_id: 1,
      event_title: "Annual Tech Symposium & Flagship Hackathon",
      organizer_name: "Aarav Patel (ACM Lead)",
      organizer_email: "acm.lead@college.edu",
      resource_name: "Dr. APJ Abdul Kalam Main Auditorium",
      resource_code: "AUDI_MAIN",
      requested_time: "2026-11-05 10:30 to 18:00 UTC",
      version: 2,
      status: "PENDING",
      submitted_at: "10 mins ago",
    },
    {
      id: 104,
      event_id: 4,
      event_title: "Freshers Cultural Welcome Night",
      organizer_name: "Music & Cultural Club",
      organizer_email: "music.club@college.edu",
      resource_name: "Mini Auditorium",
      resource_code: "AUDI_MINI",
      requested_time: "2026-11-12 17:00 to 21:00 UTC",
      version: 1,
      status: "PENDING",
      submitted_at: "2 hours ago",
    },
  ]);

  const [recentDecisions, setRecentDecisions] = React.useState([
    {
      id: 98,
      event_title: "National Cyber Security Conference",
      decision: "APPROVED",
      decided_by: "Prof. Rajesh Sharma (SW)",
      resource: "Dr. APJ Abdul Kalam Main Auditorium",
      date: "2026-10-26",
    },
    {
      id: 95,
      event_title: "Inter-College Debate Finals",
      decision: "APPROVED",
      decided_by: "Prof. Rajesh Sharma (SW)",
      resource: "Mini Auditorium",
      date: "2026-10-25",
    },
  ]);

  return (
    <AppShell
      userRole="AUTHORITY"
      userName="Prof. Rajesh Sharma"
      userEmail="dean.sw@college.edu"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-signal-orange" />
              <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight font-sans">
                Dean of Student Welfare Console
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
            <div className="text-xs text-ink font-mono uppercase">Managed Facilities</div>
            <div className="text-2xl font-semibold text-ink mt-1 font-mono">2 Venues</div>
            <div className="text-[11px] text-muted mt-1 font-sans">AUDI_MAIN (800), AUDI_MINI (250)</div>
          </div>
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="text-xs text-status-success font-mono uppercase">Signed Letters Issued</div>
            <div className="text-2xl font-semibold text-status-success mt-1 font-mono">14 Active</div>
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
              {pendingRequests.map((req) => (
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
          <h2 className="text-sm font-semibold text-ink font-mono uppercase tracking-wider">
            Recent Institutional Decisions
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Decision ID</TableHead>
                <TableHead>Event Title</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Decided By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Decision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}

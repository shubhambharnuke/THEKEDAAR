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
import { Plus, ArrowUpRight, Calendar, Users, CheckCircle2 } from "lucide-react";

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
  const [events, setEvents] = React.useState<EventSummary[]>([
    {
      id: 1,
      title: "Annual Tech Symposium & Hackathon",
      status: "APPROVED",
      expected_attendance: 450,
      total_departments: 2,
      approved_departments: 2,
      created_at: "2026-10-25T10:00:00Z",
    },
    {
      id: 2,
      title: "Robotics Design Sprint Workshop",
      status: "PARTIALLY_APPROVED",
      expected_attendance: 120,
      total_departments: 2,
      approved_departments: 1,
      created_at: "2026-10-26T14:30:00Z",
    },
    {
      id: 3,
      title: "Guest Lecture on Cryptographic Zero-Knowledge",
      status: "PENDING",
      expected_attendance: 75,
      total_departments: 1,
      approved_departments: 0,
      created_at: "2026-10-27T08:15:00Z",
    },
  ]);

  return (
    <AppShell userRole="STUDENT_CLUB" userName="ACM Chapter Lead" userEmail="acm.lead@college.edu">
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
              {events.map((ev) => (
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

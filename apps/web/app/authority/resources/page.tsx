"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Calendar, Building, Clock, Lock, ShieldCheck, ArrowLeft } from "lucide-react";

export default function AuthorityResourcesPage() {
  const [selectedVenue, setSelectedVenue] = React.useState("AUDI_MAIN");

  const venues = [
    { code: "AUDI_MAIN", name: "Dr. APJ Abdul Kalam Main Auditorium", capacity: 800 },
    { code: "AUDI_MINI", name: "Mini Auditorium", capacity: 250 },
  ];

  const bookings = [
    {
      id: 201,
      title: "University Morning Assembly",
      type: "Institutional Hold",
      date: "2026-11-05",
      time: "08:00 - 10:00 UTC",
      status: "CONFIRMED",
      organizer: "Vice Chancellor Secretariat",
    },
    {
      id: 202,
      title: "Annual Tech Symposium & Flagship Hackathon",
      type: "Student Club Event",
      date: "2026-11-05",
      time: "10:30 - 18:00 UTC",
      status: "CONFIRMED",
      organizer: "ACM Student Chapter",
    },
    {
      id: 203,
      title: "Audio-Visual Maintenance & Projector Calibration",
      type: "Maintenance Hold",
      date: "2026-11-06",
      time: "09:00 - 12:00 UTC",
      status: "CONFIRMED",
      organizer: "Campus IT & Facilities Desk",
    },
  ];

  return (
    <AppShell
      userRole="AUTHORITY"
      userName="Prof. Rajesh Sharma"
      userEmail="dean.sw@college.edu"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-signal-orange" />
              <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight font-sans">
                Facility Schedule & Slot Master
              </h1>
            </div>
            <p className="text-xs text-muted font-mono mt-0.5">
              Dean of Student Welfare — Managed Rooms & Auditoriums
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/authority/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Return to Queue
              </Button>
            </Link>
          </div>
        </div>

        {/* Venue Selector Pills */}
        <div className="flex space-x-2 border-b border-border pb-3">
          {venues.map((v) => (
            <button
              key={v.code}
              onClick={() => setSelectedVenue(v.code)}
              className={`px-3.5 py-2 text-xs font-mono font-medium rounded-[2px] transition ${
                selectedVenue === v.code
                  ? "bg-graphite text-white"
                  : "bg-white text-muted border border-border hover:text-ink"
              }`}
            >
              {v.name} ({v.code}) — {v.capacity} Seats
            </button>
          ))}
        </div>

        {/* Venue Schedule Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-mono uppercase text-muted tracking-wider">
              Confirmed Reservations for Selected Venue
            </h2>
            <span className="text-[11px] font-mono text-muted">Week of Nov 02 - Nov 08, 2026</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Event / Activity</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reserved Time Window</TableHead>
                <TableHead>Booked Entity</TableHead>
                <TableHead>Lock Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs text-muted">
                    RES-{b.id}
                  </TableCell>
                  <TableCell className="font-medium text-ink text-xs font-sans">
                    {b.title}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted">
                    {b.type}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {b.date}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-ink">
                    {b.time}
                  </TableCell>
                  <TableCell className="font-sans text-xs text-muted">
                    {b.organizer}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status="APPROVED" />
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

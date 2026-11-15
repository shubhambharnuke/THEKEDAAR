"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Calendar, Building, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { thekedarApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function AuthorityResourcesPage() {
  const { data: sessionData } = useSession();
  const [venues, setVenues] = React.useState<any[]>([]);
  const [selectedVenueId, setSelectedVenueId] = React.useState<number | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      thekedarApi.getResources().catch(() => []),
      thekedarApi.getEvents().catch(() => []),
    ])
      .then(([resData, eventsData]) => {
        setVenues(resData || []);
        if (resData && resData.length > 0) {
          setSelectedVenueId(resData[0].id);
        }
        setEvents(eventsData || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  // Extract all real bookings for the selected venue from events
  const venueBookings: Array<{
    id: string;
    title: string;
    organizer: string;
    date: string;
    time: string;
    status: string;
  }> = [];

  events.forEach((ev) => {
    (ev.department_requests || []).forEach((dr: any) => {
      (dr.requested_items || []).forEach((item: any, idx: number) => {
        if (item.resource_id === selectedVenueId) {
          const startDate = item.start_time ? new Date(item.start_time) : null;
          const endDate = item.end_time ? new Date(item.end_time) : null;
          venueBookings.push({
            id: `${ev.id}-${dr.id}-${idx}`,
            title: ev.title,
            organizer: ev.organizer_name || "Student Organization",
            date: startDate ? startDate.toLocaleDateString() : "Scheduled",
            time:
              startDate && endDate
                ? `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Full Day Window",
            status: dr.status || ev.status,
          });
        }
      });
    });
  });

  const userName = sessionData?.user?.full_name || "Dean / Authority";
  const userEmail = sessionData?.user?.email || "authority@college.edu";

  return (
    <AppShell userRole="AUTHORITY" userName={userName} userEmail={userEmail}>
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
              Institutional Master Schedule — Live Campus Room Bookings
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
        {loading ? (
          <div className="flex items-center space-x-2 text-xs font-mono text-muted py-4">
            <Loader2 className="w-4 h-4 animate-spin text-signal-orange" />
            <span>Loading facilities...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 border-b border-border pb-3">
            {venues.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVenueId(v.id)}
                className={`px-3.5 py-2 text-xs font-mono font-medium rounded-[2px] transition ${
                  selectedVenueId === v.id
                    ? "bg-graphite text-white"
                    : "bg-white text-muted border border-border hover:text-ink"
                }`}
              >
                {v.name} ({v.code}) — {v.capacity} Seats
              </button>
            ))}
          </div>
        )}

        {/* Venue Schedule Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-mono uppercase text-muted tracking-wider">
              Live Bookings for: <span className="text-ink font-bold">{selectedVenue?.name || "Selected Facility"}</span>
            </h2>
            <span className="text-[11px] font-mono text-muted">
              {venueBookings.length} Active {venueBookings.length === 1 ? "Reservation" : "Reservations"}
            </span>
          </div>

          {venueBookings.length === 0 ? (
            <div className="border border-border bg-white p-8 text-center">
              <p className="text-xs font-mono text-muted">
                No active bookings currently scheduled for this facility.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Event / Activity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reserved Time Window</TableHead>
                  <TableHead>Booked Entity</TableHead>
                  <TableHead>Approval State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venueBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs text-muted">
                      RES-{b.id}
                    </TableCell>
                    <TableCell className="font-medium text-ink text-xs font-sans">
                      {b.title}
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
                      <StatusBadge status={b.status as any} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppShell>
  );
}

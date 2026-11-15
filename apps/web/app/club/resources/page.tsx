"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Building,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { thekedarApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

interface Resource {
  id: number;
  department_id: number;
  name: string;
  code: string;
  resource_type: string;
  location: string;
  capacity: number;
  equipment_spec?: string | null;
  is_active: boolean;
  department?: {
    id: number;
    name: string;
    code: string;
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function ClubResourcesPage() {
  const { data: sessionData } = useSession();
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDept, setSelectedDept] = React.useState<string>("ALL");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");

  // Availability Checker Modal / Inline State
  const [checkingResourceId, setCheckingResourceId] = React.useState<number | null>(null);
  const [checkDate, setCheckDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [checkStartTime, setCheckStartTime] = React.useState("09:00");
  const [checkEndTime, setCheckEndTime] = React.useState("13:00");
  const [availabilityResult, setAvailabilityResult] = React.useState<{
    resourceId: number;
    available: boolean;
    message?: string;
  } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    Promise.all([
      thekedarApi.getResources().catch(() => []),
      thekedarApi.getDepartments().catch(() => []),
    ])
      .then(([resData, deptData]) => {
        if (!isMounted) return;
        setResources(resData || []);
        setDepartments(deptData || []);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err?.message || "Failed to load facilities catalogue.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCheckSlot = async (resourceId: number) => {
    setCheckingAvailability(true);
    setAvailabilityResult(null);

    const startISO = `${checkDate}T${checkStartTime}:00Z`;
    const endISO = `${checkDate}T${checkEndTime}:00Z`;

    try {
      const data = await thekedarApi.checkAvailability(resourceId, startISO, endISO);
      const isFree = data?.is_available ?? data?.available ?? true;
      setAvailabilityResult({
        resourceId,
        available: isFree,
        message: isFree
          ? "Slot is completely free and available for booking."
          : (data?.conflicts && data.conflicts.length > 0)
          ? `Reserved for '${data.conflicts[0].event_title || "Another Event"}' (${new Date(data.conflicts[0].start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(data.conflicts[0].end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
          : "Facility is reserved or has an overlapping booking for this slot.",
      });
    } catch (err: any) {
      setAvailabilityResult({
        resourceId,
        available: false,
        message: err?.message || "Unable to check slot availability.",
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Filtered catalogue
  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.department?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDept === "ALL" || String(res.department_id) === selectedDept;

    const matchesType =
      selectedType === "ALL" || res.resource_type === selectedType;

    return matchesSearch && matchesDept && matchesType;
  });

  const resourceTypes = Array.from(
    new Set(resources.map((r) => r.resource_type).filter(Boolean))
  );

  const userName = sessionData?.user?.full_name || "Club Representative";
  const userEmail = sessionData?.user?.email || "club@college.edu";

  return (
    <AppShell userRole="STUDENT_CLUB" userName={userName} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight font-sans">
              Resource Catalogue
            </h1>
            <p className="text-xs text-muted font-mono mt-0.5">
              Explore campus auditoriums, seminar halls, and computer labs for institutional bookings
            </p>
          </div>
          <Link href="/club/events/new">
            <Button variant="primary">
              <Calendar className="w-4 h-4 mr-1.5" />
              Book a Facility
            </Button>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border border-border p-4 rounded-[3px] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <Input
              placeholder="Search by facility name, code, venue or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 border border-border bg-white px-3 text-xs text-ink rounded-[3px] focus:outline-none focus:border-signal-orange"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 border border-border bg-white px-3 text-xs text-ink rounded-[3px] focus:outline-none focus:border-signal-orange"
            >
              <option value="ALL">All Facility Types</option>
              {resourceTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-muted font-mono text-xs border border-border bg-white rounded-[3px]">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-signal-orange" />
            Loading campus facility catalogue...
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredResources.length === 0 && (
          <div className="p-12 text-center text-muted font-sans text-xs border border-border bg-white rounded-[3px]">
            No facilities matched your search criteria. Try resetting filters.
          </div>
        )}

        {/* Resource Cards Grid */}
        {!loading && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((res) => {
              const deptName =
                res.department?.name ||
                departments.find((d) => d.id === res.department_id)?.name ||
                "General Administration";

              const isCheckingThis = checkingResourceId === res.id;
              const hasResult = availabilityResult?.resourceId === res.id;

              return (
                <div
                  key={res.id}
                  className="bg-white border border-border rounded-[3px] flex flex-col justify-between hover:border-signal-orange/60 transition shadow-sm"
                >
                  <div className="p-5 space-y-3.5">
                    {/* Header: Title and Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-signal-orange font-bold">
                          {res.code}
                        </span>
                        <h3 className="text-sm font-semibold text-ink font-sans leading-tight mt-0.5">
                          {res.name}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 bg-paper border border-border text-[10px] font-mono uppercase text-muted rounded-[2px] shrink-0">
                        {res.resource_type.replace("_", " ")}
                      </span>
                    </div>

                    {/* Metadata items */}
                    <div className="space-y-1.5 text-xs font-mono text-muted pt-1">
                      <div className="flex items-center">
                        <Building className="w-3.5 h-3.5 mr-2 shrink-0 text-ink" />
                        <span className="truncate">{deptName}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-2 shrink-0 text-ink" />
                        <span className="truncate">{res.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3.5 h-3.5 mr-2 shrink-0 text-ink" />
                        <span>Capacity: {res.capacity} attendees</span>
                      </div>
                    </div>

                    {/* Equipment specs */}
                    {res.equipment_spec && (
                      <div className="p-2.5 bg-paper border border-border text-[11px] font-mono text-muted rounded-[2px]">
                        <span className="text-ink font-medium">Specs: </span>
                        {res.equipment_spec}
                      </div>
                    )}

                    {/* Inline Quick Slot Availability Checker */}
                    {isCheckingThis && (
                      <div className="mt-3 p-3 bg-paper border border-border rounded-[2px] space-y-2.5">
                        <div className="text-[11px] font-mono font-medium text-ink flex items-center justify-between">
                          <span>Check Slot Availability</span>
                          <button
                            onClick={() => {
                              setCheckingResourceId(null);
                              setAvailabilityResult(null);
                            }}
                            className="text-muted hover:text-ink text-xs"
                          >
                            Close
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            type="date"
                            value={checkDate}
                            onChange={(e) => setCheckDate(e.target.value)}
                            className="text-xs h-8"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="time"
                              value={checkStartTime}
                              onChange={(e) => setCheckStartTime(e.target.value)}
                              className="text-xs h-8"
                            />
                            <Input
                              type="time"
                              value={checkEndTime}
                              onChange={(e) => setCheckEndTime(e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-8"
                          onClick={() => handleCheckSlot(res.id)}
                          isLoading={checkingAvailability}
                        >
                          Check Slot
                        </Button>

                        {hasResult && (
                          <div
                            className={`p-2 border text-[11px] font-mono flex items-start gap-1.5 ${
                              availabilityResult.available
                                ? "bg-[#EBF5F0] border-[#A3D9C0] text-[#1E6B47]"
                                : "bg-status-error/10 border-status-error/30 text-status-error"
                            }`}
                          >
                            {availabilityResult.available ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            )}
                            <span>{availabilityResult.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="p-4 border-t border-border bg-[#FAFAFA] flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setCheckingResourceId(isCheckingThis ? null : res.id);
                        setAvailabilityResult(null);
                      }}
                      className="text-xs font-mono text-muted hover:text-ink flex items-center transition"
                    >
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {isCheckingThis ? "Hide slot check" : "Check slot"}
                    </button>

                    <Link href={`/club/events/new`}>
                      <Button size="sm" variant="primary">
                        Request
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

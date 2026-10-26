"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import {
  Building,
  Calendar,
  Clock,
  Download,
  FileCheck2,
  AlertCircle,
  ArrowLeft,
  X,
  FileText,
} from "lucide-react";

interface SubRequest {
  id: number;
  department_id: number;
  department_name: string;
  department_code: string;
  current_version: number;
  status: "PENDING" | "CORRECTION_REQUESTED" | "APPROVED" | "REJECTED";
  remarks?: string;
  letter_id?: string;
  resources: Array<{
    name: string;
    code: string;
    start: string;
    end: string;
  }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = React.useState({
    id: eventId,
    title: "Annual Tech Symposium & Flagship Hackathon",
    description: "Multi-track technical symposium covering AI, Web3, and Systems Engineering.",
    expected_attendance: 450,
    status: "PARTIALLY_APPROVED",
    created_at: "2026-10-25 10:00:00 UTC",
    organizer_name: "Aarav Patel (ACM Chapter President)",
  });

  const [subRequests, setSubRequests] = React.useState<SubRequest[]>([
    {
      id: 101,
      department_id: 1,
      department_name: "Dean of Academic Affairs",
      department_code: "DEAN_ACAD",
      current_version: 1,
      status: "APPROVED",
      letter_id: "PL-DEAN_ACAD-0001-V1-A8F92D",
      remarks: "Approved for academic use. Ensure sound limits are maintained.",
      resources: [
        {
          name: "Sir Visvesvaraya Seminar Hall A",
          code: "SEM_HALL_A",
          start: "2026-11-05 09:00",
          end: "2026-11-05 17:00",
        },
      ],
    },
    {
      id: 102,
      department_id: 2,
      department_name: "Dean of Student Welfare",
      department_code: "STUDENT_WELFARE",
      current_version: 1,
      status: "CORRECTION_REQUESTED",
      remarks: "Auditorium is booked until 10:00 AM for university assembly. Please modify start time to 10:30 AM.",
      resources: [
        {
          name: "Dr. APJ Abdul Kalam Main Auditorium",
          code: "AUDI_MAIN",
          start: "2026-11-05 09:00",
          end: "2026-11-05 18:00",
        },
      ],
    },
  ]);

  // Modal State for Resubmission
  const [resubmittingReq, setResubmittingReq] = React.useState<SubRequest | null>(null);
  const [newStartTime, setNewStartTime] = React.useState("10:30");
  const [newEndTime, setNewEndTime] = React.useState("18:00");
  const [resubmitLoading, setResubmitLoading] = React.useState(false);

  const handleResubmit = () => {
    if (!resubmittingReq) return;
    setResubmitLoading(true);

    setTimeout(() => {
      // Simulate version increment and status reset to PENDING
      setSubRequests(
        subRequests.map((r) =>
          r.id === resubmittingReq.id
            ? {
                ...r,
                current_version: r.current_version + 1,
                status: "PENDING",
                remarks: undefined,
                resources: [
                  {
                    ...r.resources[0],
                    start: `2026-11-05 ${newStartTime}`,
                    end: `2026-11-05 ${newEndTime}`,
                  },
                ],
              }
            : r
        )
      );
      setResubmitLoading(false);
      setResubmittingReq(null);
    }, 600);
  };

  return (
    <AppShell userRole="STUDENT_CLUB" userName="ACM Chapter Lead" userEmail="acm.lead@college.edu">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-mono text-muted">
          <Link href="/club/dashboard" className="hover:text-ink">
            My Events
          </Link>
          <span>/</span>
          <span className="text-ink">EV-{eventId.padStart(4, "0")}</span>
        </div>

        {/* Event Header Banner */}
        <div className="bg-white border border-border p-6 rounded-[3px] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="text-xs font-mono text-muted uppercase">
                Event Reference: EV-{eventId.padStart(4, "0")}
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-ink font-sans mt-0.5">
                {event.title}
              </h1>
            </div>
            <StatusBadge status={event.status} className="text-xs px-2.5 py-1" />
          </div>

          <p className="text-xs md:text-sm text-muted font-sans max-w-3xl leading-relaxed">
            {event.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border text-xs font-mono">
            <div>
              <span className="text-muted block">Organizer:</span>
              <span className="text-ink font-medium">{event.organizer_name}</span>
            </div>
            <div>
              <span className="text-muted block">Expected Crowd:</span>
              <span className="text-ink font-medium">{event.expected_attendance} Attendees</span>
            </div>
            <div>
              <span className="text-muted block">Submitted Date:</span>
              <span className="text-ink font-medium">{event.created_at.slice(0, 10)}</span>
            </div>
            <div>
              <span className="text-muted block">Overall Status:</span>
              <span className="text-signal-orange font-medium">{event.status.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        {/* Department Requests Breakdown */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-ink font-mono uppercase tracking-wider">
            Department-Wise Approval Breakdown
          </h2>

          <div className="space-y-4">
            {subRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-border p-5 rounded-[3px] space-y-4 transition"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-border">
                  <div className="flex items-center space-x-2.5">
                    <Building className="w-4 h-4 text-signal-orange" />
                    <span className="font-semibold text-sm text-ink font-sans">
                      {req.department_name} ({req.department_code})
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      [Version v{req.current_version}.0]
                    </span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                {/* Allocated Resources List */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-muted">
                    Allocated Facilities & Approved Windows:
                  </div>
                  <div className="bg-paper border border-border p-3 divide-y divide-border rounded-[2px]">
                    {req.resources.map((res, i) => (
                      <div key={i} className="py-1.5 first:pt-0 last:pb-0 flex justify-between text-xs">
                        <span className="font-medium text-ink font-sans">{res.name} ({res.code})</span>
                        <span className="font-mono text-muted">{res.start} to {res.end}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correction Remarks Alert */}
                {req.remarks && (
                  <div
                    className={`p-3 text-xs font-mono border rounded-[2px] ${
                      req.status === "CORRECTION_REQUESTED"
                        ? "bg-[#FAF4E8] text-[#946318] border-[#EAD6A8]"
                        : "bg-[#EBF5F0] text-[#237A50] border-[#B9E2CE]"
                    }`}
                  >
                    <div className="font-bold uppercase text-[10px] mb-0.5">
                      {req.status === "CORRECTION_REQUESTED" ? "Correction Instructions:" : "Authority Note:"}
                    </div>
                    {req.remarks}
                  </div>
                )}

                {/* Actions per Department Request */}
                <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
                  <div className="text-xs font-mono text-muted">
                    {req.letter_id ? (
                      <span className="text-ink font-mono text-[11px]">
                        Letter Ref: <b>{req.letter_id}</b>
                      </span>
                    ) : (
                      "Official letter generated upon approval"
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {req.status === "CORRECTION_REQUESTED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setResubmittingReq(req);
                        }}
                      >
                        Resubmit Corrections (v{req.current_version + 1})
                      </Button>
                    )}

                    {req.status === "APPROVED" && (
                      <a
                        href={`http://localhost:8000/api/v1/documents/${req.letter_id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-signal-orange text-white text-xs font-medium rounded-[3px] hover:bg-[#d65f2f] transition font-mono"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download Signed PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resubmission Modal */}
        {resubmittingReq && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-border max-w-md w-full p-6 space-y-4 rounded-[3px] shadow-lg">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h3 className="text-sm font-semibold text-ink font-sans">
                  Resubmit Corrections for {resubmittingReq.department_code}
                </h3>
                <button
                  onClick={() => setResubmittingReq(null)}
                  className="text-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-muted font-mono bg-paper p-3 border border-border">
                <b>Required Correction:</b> {resubmittingReq.remarks}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-ink mb-1 uppercase">New Start Time</label>
                    <Input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-ink mb-1 uppercase">New End Time</label>
                    <Input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setResubmittingReq(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleResubmit}
                  isLoading={resubmitLoading}
                >
                  Confirm & Submit Version {resubmittingReq.current_version + 1}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

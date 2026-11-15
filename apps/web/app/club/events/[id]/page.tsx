"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Loader2,
  Trash2,
} from "lucide-react";
import { thekedarApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

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
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { data: sessionData } = useSession();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [event, setEvent] = React.useState<any>({
    id: eventId,
    title: `Event #${eventId}`,
    description: "",
    expected_attendance: 0,
    status: "PENDING",
    created_at: "",
    organizer_name: "Club Organizer",
  });

  const [subRequests, setSubRequests] = React.useState<SubRequest[]>([]);

  // Modal State for Resubmission
  const [resubmittingReq, setResubmittingReq] = React.useState<SubRequest | null>(null);
  const [newStartTime, setNewStartTime] = React.useState("10:30");
  const [newEndTime, setNewEndTime] = React.useState("18:00");
  const [resubmitLoading, setResubmitLoading] = React.useState(false);
  const [resubmitError, setResubmitError] = React.useState<string | null>(null);

  const fetchEventData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await thekedarApi.getEvent(Number(eventId));
      if (data) {
        setEvent({
          id: data.id,
          title: data.title,
          description: data.description || "No description provided.",
          expected_attendance: data.expected_attendance || 0,
          status: data.status,
          created_at: data.created_at || "",
          organizer_name: data.organizer?.full_name || "Club Representative",
        });

        const mapped: SubRequest[] = (data.department_requests || []).map((dr: any) => {
          const items = dr.requested_items || [];
          const bookings = dr.bookings || [];

          // Derive resource display from requested_items or confirmed bookings
          let resList: Array<{ name: string; code: string; start: string; end: string }> = [];
          if (items.length > 0) {
            resList = items.map((it: any) => ({
              name: it.resource_name || "Department Venue",
              code: it.resource_code || "ROOM",
              start: it.start_time?.slice(0, 16).replace("T", " ") || "",
              end: it.end_time?.slice(11, 16) || "",
            }));
          } else if (bookings.length > 0) {
            resList = bookings.map((b: any) => ({
              name: b.resource?.name || "Allocated Facility",
              code: b.resource?.code || "RES",
              start: b.start_time?.slice(0, 16).replace("T", " ") || "",
              end: b.end_time?.slice(11, 16) || "",
            }));
          }

          return {
            id: dr.id,
            department_id: dr.department_id,
            department_name: dr.department_name || dr.department?.name || `Department #${dr.department_id}`,
            department_code: dr.department_code || dr.department?.code || "DEPT",
            current_version: dr.current_version || 1,
            status: dr.status,
            remarks: dr.remarks,
            letter_id: dr.permission_letter_id || dr.permission_letter?.id,
            resources: resList,
          };
        });
        setSubRequests(mapped);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load event details from database.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const handleDeleteEvent = async () => {
    try {
      setDeleting(true);
      await thekedarApi.deleteEvent(Number(eventId));
      router.push("/club/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to delete event request.");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleResubmit = async () => {
    if (!resubmittingReq) return;
    setResubmitLoading(true);
    setResubmitError(null);

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const firstRes = resubmittingReq.resources[0];
      const startDateTime = `${todayStr}T${newStartTime}:00Z`;
      const endDateTime = `${todayStr}T${newEndTime}:00Z`;

      await thekedarApi.resubmitRequest(resubmittingReq.id, {
        resource_bookings: [
          {
            resource_id: resubmittingReq.department_id,
            start_time: startDateTime,
            end_time: endDateTime,
          },
        ],
        remarks: "Resubmitted with adjusted timing.",
      });

      await fetchEventData();
      setResubmittingReq(null);
    } catch (err: any) {
      setResubmitError(err?.message || "Failed to resubmit request.");
    } finally {
      setResubmitLoading(false);
    }
  };

  const userName = sessionData?.user?.full_name || "Club Representative";
  const userEmail = sessionData?.user?.email || "club@college.edu";

  return (
    <AppShell userRole="STUDENT_CLUB" userName={userName} userEmail={userEmail}>
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
            <div className="flex items-center space-x-3">
              <StatusBadge status={event.status} className="text-xs px-2.5 py-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Request
              </Button>
            </div>
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

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-border max-w-sm w-full p-6 space-y-4 rounded-[3px] shadow-lg">
              <div className="flex items-center space-x-2 text-red-600">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold font-sans">Delete Event Request</h3>
              </div>
              <p className="text-xs text-muted font-sans leading-relaxed">
                Are you sure you want to delete <strong className="text-ink">{event.title}</strong>? All associated departmental booking requests and versions will be permanently removed.
              </p>
              <div className="pt-2 border-t border-border flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDeleteEvent}
                  isLoading={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        )}

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

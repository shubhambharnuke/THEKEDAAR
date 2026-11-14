"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import {
  Building,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  History,
  FileCheck,
  User,
  Loader2,
} from "lucide-react";
import { thekedarApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function AuthorityReviewPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const { data: sessionData } = useSession();

  const [remarks, setRemarks] = React.useState("");
  const [submittingAction, setSubmittingAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const [requestData, setRequestData] = React.useState({
    id: requestId,
    event_id: 1,
    event_title: "Event Request",
    organizer_name: "Club Representative",
    organizer_email: "club@college.edu",
    expected_attendance: 0,
    version: 1,
    status: "PENDING",
    venue_name: "Venue",
    venue_code: "VENUE",
    venue_capacity: 0,
    venue_location: "Campus",
    equipment_spec: "Standard equipment",
    requested_start: "",
    requested_end: "",
    permission_letter_id: null as string | null,
    requested_items: [] as any[],
    changelog: [] as Array<{ version: string; note: string; date: string }>,
  });

  const fetchRequest = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await thekedarApi.getDepartmentRequest(Number(requestId));
      if (data) {
        const firstItem = data.requested_items && data.requested_items[0];
        const firstBooking = data.bookings && data.bookings[0];

        const venueName = firstItem?.resource_name || firstBooking?.resource?.name || "Allocated Facility";
        const venueCode = firstItem?.resource_code || firstBooking?.resource?.code || "VENUE";
        const startTime = firstItem?.start_time || firstBooking?.start_time || "";
        const endTime = firstItem?.end_time || firstBooking?.end_time || "";

        setRequestData({
          id: String(data.id),
          event_id: data.event_id,
          event_title: data.event_title || data.event?.title || `Event #${data.event_id}`,
          organizer_name: data.organizer_name || data.event?.organizer?.full_name || "Club Representative",
          organizer_email: data.organizer_email || data.event?.organizer?.email || "club@college.edu",
          expected_attendance: data.event?.expected_attendance || 0,
          version: data.current_version || 1,
          status: data.status || "PENDING",
          venue_name: venueName,
          venue_code: venueCode,
          venue_capacity: firstBooking?.resource?.capacity || 100,
          venue_location: firstBooking?.resource?.location || "Campus Block",
          equipment_spec: firstBooking?.resource?.equipment_spec || "Standard equipment",
          requested_start: startTime ? startTime.slice(0, 16).replace("T", " ") : "",
          requested_end: endTime ? endTime.slice(0, 16).replace("T", " ") : "",
          permission_letter_id: data.permission_letter_id || null,
          requested_items: data.requested_items || [],
          changelog: (data.decisions || []).map((d: any) => ({
            version: `Decision by ${d.reviewer_name || d.reviewer?.full_name || "Authority"}`,
            note: d.remarks || d.action,
            date: d.timestamp ? d.timestamp.slice(0, 16).replace("T", " ") : "",
          })),
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load request details.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  React.useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleDecision = async (action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION") => {
    setError(null);

    if (action === "REQUEST_CORRECTION" && !remarks.trim()) {
      setError("Please specify required corrections in the remarks field before submitting.");
      return;
    }

    setSubmittingAction(action);

    try {
      await thekedarApi.submitDecision(Number(requestId), action, remarks);

      if (action === "APPROVE") {
        setSuccessMessage(
          "Request officially approved! Confirmed booking has been locked, and cryptographic permission letter has been signed and dispatched."
        );
      } else if (action === "REQUEST_CORRECTION") {
        setSuccessMessage(
          "Correction instructions returned to organizer. Sub-request status marked Needs Correction."
        );
      } else {
        setSuccessMessage("Request officially rejected.");
      }
      setSubmittingAction(null);

      setTimeout(() => {
        router.push("/authority/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to submit decision.");
      setSubmittingAction(null);
    }
  };

  const userName = sessionData?.user?.full_name || "Department Authority";
  const userEmail = sessionData?.user?.email || "authority@college.edu";

  return (
    <AppShell
      userRole="AUTHORITY"
      userName={userName}
      userEmail={userEmail}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs font-mono text-muted">
          <Link href="/authority/dashboard" className="hover:text-ink">
            &larr; Authority Queue
          </Link>
          <span>/</span>
          <span className="text-ink">Review Request REQ-{requestId}</span>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 bg-[#EBF5F0] border border-[#B9E2CE] text-[#237A50] text-xs font-mono flex items-center rounded-[3px]">
            <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono rounded-[3px]">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-white border border-border p-12 text-center text-muted font-mono text-xs rounded-[3px]">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-signal-orange" />
            Loading request details from database...
          </div>
        )}

        {!loading && (
        /* Split Layout Container */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT PANE: Event & Venue Review (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Event Overview Card */}
            <div className="bg-white border border-border p-5 rounded-[3px] space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[11px] font-mono text-muted uppercase">
                    Sub-Request Reference: REQ-{requestId}
                  </div>
                  <h2 className="text-lg font-semibold text-ink font-sans mt-0.5">
                    {requestData.event_title}
                  </h2>
                </div>
                <StatusBadge status={requestData.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border text-xs font-mono">
                <div>
                  <span className="text-muted block">Organizer:</span>
                  <span className="text-ink font-medium">{requestData.organizer_name}</span>
                </div>
                <div>
                  <span className="text-muted block">Expected Attendance:</span>
                  <span className="text-ink font-medium">{requestData.expected_attendance} Attendees</span>
                </div>
              </div>
            </div>

            {/* Requested Facility & Slot Specifications */}
            <div className="bg-white border border-border p-5 rounded-[3px] space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-border">
                <Building className="w-4 h-4 text-signal-orange" />
                <h3 className="text-xs font-semibold uppercase font-mono text-ink tracking-wider">
                  Requested Facility Specifications
                </h3>
              </div>

              {requestData.requested_items.length > 0 ? (
                <div className="space-y-3">
                  {requestData.requested_items.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-paper border border-border rounded-[2px] space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-ink font-sans">
                          {item.resource_name || "Facility"} ({item.resource_code || "ROOM"})
                        </span>
                        <span className="font-mono text-muted text-[11px]">Item #{idx + 1}</span>
                      </div>
                      <div className="text-xs font-mono text-muted flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-signal-orange shrink-0" />
                        <span>
                          {item.start_time?.slice(0, 16).replace("T", " ")} to {item.end_time?.slice(11, 16)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted font-mono">Facility:</span>
                    <span className="font-semibold text-ink font-sans">
                      {requestData.venue_name} ({requestData.venue_code})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-mono">Location:</span>
                    <span className="text-ink font-sans">{requestData.venue_location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-mono">Max Seating Capacity:</span>
                    <span className="font-mono text-ink font-semibold">{requestData.venue_capacity} seats</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-mono">Installed Equipment:</span>
                    <span className="text-ink font-sans text-right max-w-xs">{requestData.equipment_spec}</span>
                  </div>
                  {/* Time Window Card */}
                  <div className="p-3 bg-paper border border-border rounded-[2px] space-y-1 mt-2">
                    <div className="text-[10px] font-mono uppercase text-muted">Requested Timing Window:</div>
                    <div className="text-xs font-mono font-bold text-ink flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-signal-orange" />
                      {requestData.requested_start} to {requestData.requested_end}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Version Revision Changelog */}
            <div className="bg-white border border-border p-5 rounded-[3px] space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-border">
                <History className="w-4 h-4 text-muted" />
                <h3 className="text-xs font-semibold uppercase font-mono text-ink tracking-wider">
                  Request Version History
                </h3>
              </div>

              <div className="space-y-3">
                {requestData.changelog.map((log, i) => (
                  <div key={i} className="text-xs border-l-2 border-border pl-3 space-y-0.5">
                    <div className="font-mono text-ink font-semibold">{log.version}</div>
                    <div className="text-muted text-[11px] font-sans">{log.note}</div>
                    <div className="text-muted font-mono text-[10px]">{log.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Authority Decision Console (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-border p-5 rounded-[3px] space-y-5 sticky top-6">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-ink font-sans">Authority Decision Console</h3>
              <p className="text-xs text-muted font-mono mt-0.5">
                Official actions will be recorded in the immutable audit log and registered on Sepolia
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase text-ink font-medium">
                Decision Remarks & Instructions
              </label>
              <Textarea
                placeholder="Enter approval conditions, room usage guidelines, or specific correction requirements..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-[11px] text-muted font-mono">
                * Mandatory when choosing "Request Corrections". Included in the signed letter.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                className="w-full h-11 text-xs md:text-sm font-mono uppercase tracking-wider"
                onClick={() => handleDecision("APPROVE")}
                isLoading={submittingAction === "APPROVE"}
              >
                Approve & Digitally Sign Letter
              </Button>

              <Button
                variant="secondary"
                className="w-full text-xs font-mono uppercase tracking-wider"
                onClick={() => handleDecision("REQUEST_CORRECTION")}
                isLoading={submittingAction === "REQUEST_CORRECTION"}
              >
                Request Corrections from Club
              </Button>

              <Button
                variant="destructive"
                className="w-full text-xs font-mono uppercase tracking-wider"
                onClick={() => handleDecision("REJECT")}
                isLoading={submittingAction === "REJECT"}
              >
                Reject Request
              </Button>
            </div>

            {/* Safety & Protocol Notice */}
            <div className="pt-3 border-t border-border text-[11px] text-muted font-mono space-y-1">
              {requestData.permission_letter_id && (
                <div className="p-2 bg-[#EBF5F0] border border-[#B9E2CE] text-[#237A50] rounded-[2px] mb-2 flex justify-between items-center">
                  <span>Signed Letter: {requestData.permission_letter_id}</span>
                  <a
                    href={`http://localhost:8000/api/v1/documents/${requestData.permission_letter_id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold"
                  >
                    Download PDF
                  </a>
                </div>
              )}
              <div>• Approving acquires an exclusive reservation lock.</div>
              <div>• Generates an RSA-signed letter stored with SHA-256 hash.</div>
            </div>
          </div>
        </div>
        )}
      </div>
    </AppShell>
  );
}

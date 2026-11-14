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
import { History, ArrowLeft, Loader2, AlertCircle, Download } from "lucide-react";
import { thekedarApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function AuthorityHistoryPage() {
  const { data: sessionData } = useSession();
  const [decisions, setDecisions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    thekedarApi
      .getAuthorityDecisions()
      .then((data) => {
        if (isMounted) {
          setDecisions(data || []);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || "Failed to load decision history.");
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
    <AppShell userRole="AUTHORITY" userName={userName} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-signal-orange" />
              <h1 className="text-xl md:text-2xl font-semibold text-ink tracking-tight font-sans">
                Institutional Decision History
              </h1>
            </div>
            <p className="text-xs text-muted font-mono mt-0.5">
              Comprehensive chronological log of departmental approvals, corrections, and rejections
            </p>
          </div>
          <Link href="/authority/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Decisions Table */}
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Decision ID</TableHead>
                <TableHead>Event Title</TableHead>
                <TableHead>Venue / Resource</TableHead>
                <TableHead>Decided By</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Permission Letter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted font-mono text-xs">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2 text-signal-orange" />
                    Loading decision history...
                  </TableCell>
                </TableRow>
              )}

              {error && !loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-red-600 font-mono text-xs">
                    <AlertCircle className="w-4 h-4 inline mr-1.5" />
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && decisions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted font-sans text-xs">
                    No institutional decisions recorded yet for your department.
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                decisions.map((dec) => (
                  <TableRow key={dec.id}>
                    <TableCell className="font-mono text-xs text-muted">
                      DEC-{dec.id}
                    </TableCell>
                    <TableCell className="font-medium text-ink text-xs font-sans">
                      {dec.event_title}
                    </TableCell>
                    <TableCell className="text-xs text-muted font-sans">
                      {dec.resource}
                    </TableCell>
                    <TableCell className="text-xs text-muted font-mono">
                      {dec.decided_by}
                    </TableCell>
                    <TableCell className="text-xs text-muted font-mono">
                      {dec.date} {dec.timestamp ? dec.timestamp.slice(11, 16) : ""}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={dec.decision} />
                    </TableCell>
                    <TableCell className="text-xs text-muted font-mono max-w-xs truncate">
                      {dec.remarks || "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {dec.permission_letter_id ? (
                        <a
                          href={`http://localhost:8000/api/v1/documents/${dec.permission_letter_id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-signal-orange text-white text-[11px] font-medium rounded hover:bg-[#d65f2f] transition"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download PDF
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
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

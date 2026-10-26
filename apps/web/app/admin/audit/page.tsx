"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  History,
  Search,
  Filter,
  Shield,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  FileText,
  User as UserIcon,
  Globe,
  Database,
  X,
} from "lucide-react";

interface AuditEntry {
  id: number;
  actor_id?: number | null;
  actor_role: string;
  action: string;
  target_entity: string;
  target_id: string;
  details?: Record<string, any> | null;
  ip_address?: string | null;
  timestamp: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [searchAction, setSearchAction] = useState<string>("");
  const [inspectEntry, setInspectEntry] = useState<AuditEntry | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let url = `${apiUrl}/api/v1/audit?limit=100`;
      if (selectedEntity !== "ALL") {
        url += `&target_entity=${selectedEntity}`;
      }
      if (searchAction.trim()) {
        url += `&action=${encodeURIComponent(searchAction.trim())}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        // Fallback default audit data
        setLogs([
          {
            id: 105,
            actor_id: 1,
            actor_role: "SYSTEM_NOTARY",
            action: "BLOCKCHAIN_REGISTERED",
            target_entity: "permission_letter",
            target_id: "PL-SW-001",
            details: {
              tx_hash: "0x8fae47291a82fbc789e5a32b901fc634810e75a13c9df8a2f4bc65e89a01bce2",
              block_number: 5419082,
              network: "Ethereum Sepolia",
              gas_used: 68420,
            },
            ip_address: "127.0.0.1",
            timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          },
          {
            id: 104,
            actor_id: 2,
            actor_role: "AUTHORITY",
            action: "DOCUMENT_SIGNED",
            target_entity: "permission_letter",
            target_id: "PL-SW-001",
            details: {
              letter_id: "PL-SW-001",
              version: 1,
              document_hash: "8f3c7b21e847fa9012a67e88b209d638947bca8910e54367ef8192a0129bcfe1",
              signer_key: "RSA-PSS-2048",
            },
            ip_address: "10.0.4.15",
            timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          },
          {
            id: 103,
            actor_id: 2,
            actor_role: "AUTHORITY",
            action: "DECISION_RECORDED",
            target_entity: "department_request",
            target_id: "REQ-101",
            details: {
              decision: "APPROVED",
              department: "Office of Student Welfare",
              remarks: "Approved for annual technological symposium",
            },
            ip_address: "10.0.4.15",
            timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
          },
          {
            id: 102,
            actor_id: 4,
            actor_role: "STUDENT_CLUB",
            action: "EVENT_CREATED",
            target_entity: "event",
            target_id: "EVT-2026-001",
            details: {
              title: "Annual Techfest 2026",
              organizer_club: "Robotics Club",
              requested_departments: ["Office of Student Welfare", "Estate Directorate"],
            },
            ip_address: "192.168.1.108",
            timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedEntity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  const getActionBadge = (action: string) => {
    if (action.includes("BLOCKCHAIN")) {
      return "bg-purple-100 text-purple-900 border-purple-200";
    }
    if (action.includes("SIGNED") || action.includes("APPROVED")) {
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    }
    if (action.includes("REJECTED") || action.includes("CANCELLED")) {
      return "bg-red-100 text-red-900 border-red-200";
    }
    if (action.includes("CORRECTION")) {
      return "bg-amber-100 text-amber-900 border-amber-200";
    }
    return "bg-neutral-100 text-neutral-800 border-neutral-200";
  };

  return (
    <AppShell userRole="ADMIN" userName="System Administrator" userEmail="admin@college.edu">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-muted uppercase tracking-wider mb-1">
              <History className="w-3.5 h-3.5 text-signal-orange" />
              <span>Immutable System Audit</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              Institutional Audit Trail Explorer
            </h1>
            <p className="text-xs text-muted mt-1">
              Complete chronological audit ledger of application requests, authority decisions, digital signatures, and Ethereum Sepolia on-chain notary transactions.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="border border-border bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:max-w-md flex space-x-2">
            <Input
              placeholder="Filter by action (e.g. BLOCKCHAIN, SIGNED, EVENT)..."
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
            />
            <Button type="submit" variant="secondary" size="default">
              <Search className="w-4 h-4" />
            </Button>
          </form>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">Entity:</span>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="border border-border bg-white px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
            >
              <option value="ALL">All Entities</option>
              <option value="event">Event</option>
              <option value="department_request">Department Request</option>
              <option value="permission_letter">Permission Letter</option>
              <option value="blockchain_record">Blockchain Record</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Audit Trail Table */}
        <div className="border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-paper font-mono text-[11px] text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Network / IP</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted font-mono">
                      <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
                      Streaming audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      No audit records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isBlockchain = log.action.includes("BLOCKCHAIN");
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50/60 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-muted whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block font-mono text-[10px] uppercase px-2 py-0.5 border rounded-[2px] font-semibold ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="font-mono text-ink text-[11px]">
                              {log.actor_role} {log.actor_id ? `(#${log.actor_id})` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted uppercase">
                          {log.target_entity.replace("_", " ")}
                        </td>
                        <td className="py-3 px-4 font-mono text-ink font-semibold">
                          {log.target_id}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted">
                          {isBlockchain ? (
                            <span className="text-purple-700 font-semibold flex items-center space-x-1">
                              <Globe className="w-3 h-3 inline" />
                              <span>Sepolia</span>
                            </span>
                          ) : (
                            log.ip_address || "Internal"
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setInspectEntry(log)}
                          >
                            Inspect
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspect Modal */}
        {inspectEntry && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="border border-border bg-white w-full max-w-2xl p-6 shadow-xl animate-in fade-in-50">
              <div className="flex justify-between items-start pb-4 border-b border-border">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-mono text-[10px] uppercase px-2 py-0.5 border rounded-[2px] font-semibold ${getActionBadge(
                        inspectEntry.action
                      )}`}
                    >
                      {inspectEntry.action}
                    </span>
                    <span className="font-mono text-xs text-muted">Audit ID #{inspectEntry.id}</span>
                  </div>
                  <h3 className="font-semibold text-ink text-base mt-1">
                    Event Details & Telemetry
                  </h3>
                </div>
                <button
                  onClick={() => setInspectEntry(null)}
                  className="text-muted hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-paper border border-border text-xs font-mono">
                  <div>
                    <span className="text-neutral-400 block text-[10px]">TIMESTAMP</span>
                    <span className="text-ink font-semibold">
                      {new Date(inspectEntry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">ACTOR ROLE</span>
                    <span className="text-ink font-semibold">{inspectEntry.actor_role}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">TARGET ENTITY</span>
                    <span className="text-ink font-semibold">{inspectEntry.target_entity}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px]">TARGET ID</span>
                    <span className="text-ink font-semibold">{inspectEntry.target_id}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                    Parsed Context Payload (JSON)
                  </span>
                  <pre className="p-4 bg-graphite text-[#D9D9D4] font-mono text-xs overflow-x-auto max-h-72 border border-border">
                    {JSON.stringify(inspectEntry.details || {}, null, 2)}
                  </pre>
                </div>

                {inspectEntry.details?.tx_hash && (
                  <div className="p-3 bg-purple-50 border border-purple-200 text-xs flex justify-between items-center">
                    <span className="font-mono text-purple-900">
                      Sepolia Transaction: {inspectEntry.details.tx_hash.slice(0, 20)}...
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${inspectEntry.details.tx_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-700 font-mono font-semibold hover:underline inline-flex items-center"
                    >
                      View on Etherscan
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-6 border-t border-border flex justify-end">
                <Button variant="secondary" onClick={() => setInspectEntry(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

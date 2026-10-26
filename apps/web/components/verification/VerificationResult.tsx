"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Lock,
  Layers,
  Clock,
} from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";

export interface VerificationData {
  is_authentic: boolean;
  signature_valid: boolean;
  hash_matched: boolean;
  status?: string | null;
  letter_id?: string | null;
  version_number?: number | null;
  event_title?: string | null;
  department_name?: string | null;
  issued_at?: string | null;
  message: string;
  document_hash?: string | null;
  // Blockchain verification data
  blockchain?: {
    is_registered: boolean;
    tx_hash?: string | null;
    block_number?: number | null;
    timestamp?: number | null;
    issuer?: string | null;
    is_revoked?: boolean;
    network?: string;
  } | null;
}

interface VerificationResultProps {
  data: VerificationData;
}

export default function VerificationResult({ data }: VerificationResultProps) {
  const isSuperseded = data.status === "SUPERSEDED";
  const isRevoked = data.status === "REVOKED" || data.blockchain?.is_revoked;
  const isPending = data.status === "PENDING";
  const isValid = data.status === "VALID" && data.signature_valid && data.hash_matched && !isRevoked;

  // Formatted date
  const formattedDate = data.issued_at
    ? new Date(data.issued_at).toLocaleString()
    : data.blockchain?.timestamp
    ? new Date(data.blockchain.timestamp * 1000).toLocaleString()
    : "Timestamp recorded on-chain";

  return (
    <div className="border border-border bg-white mt-8 overflow-hidden font-sans">
      {/* Top Header Banner */}
      <div
        className={`p-6 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
          isValid
            ? "bg-emerald-50/50"
            : isSuperseded
            ? "bg-amber-50/50"
            : "bg-red-50/50"
        }`}
      >
        <div className="flex items-start space-x-3">
          {isValid ? (
            <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
          ) : isSuperseded ? (
            <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
          )}

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-graphite">
                Verification Outcome
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 uppercase font-semibold ${
                  isValid
                    ? "bg-emerald-100 text-emerald-800"
                    : isSuperseded
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isValid
                  ? "Authentic & Current"
                  : isSuperseded
                  ? "Superseded Version"
                  : isRevoked
                  ? "Revoked Authorization"
                  : "Verification Failed"}
              </span>
            </div>
            <p className="text-sm font-medium text-ink mt-1">{data.message}</p>
          </div>
        </div>

        {data.letter_id && (
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted block">Document ID</span>
            <span className="font-mono text-sm font-bold text-graphite">{data.letter_id}</span>
          </div>
        )}
      </div>

      {/* Document Metadata Summary */}
      <div className="p-6 border-b border-border bg-paper grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-neutral-400 uppercase text-[10px] block">Event Title</span>
          <span className="text-ink font-semibold mt-0.5 block truncate">
            {data.event_title || "N/A"}
          </span>
        </div>
        <div>
          <span className="text-neutral-400 uppercase text-[10px] block">Issuing Authority</span>
          <span className="text-ink font-semibold mt-0.5 block truncate">
            {data.department_name || "Institutional Authority"}
          </span>
        </div>
        <div>
          <span className="text-neutral-400 uppercase text-[10px] block">Document Version</span>
          <span className="text-ink font-semibold mt-0.5 block">
            v{data.version_number || 1}
          </span>
        </div>
        <div>
          <span className="text-neutral-400 uppercase text-[10px] block">Issue Timestamp</span>
          <span className="text-ink font-semibold mt-0.5 block truncate">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Sequential Verification Check Pipeline */}
      <div className="p-6">
        <h3 className="font-mono text-xs uppercase tracking-wider text-muted font-bold mb-4">
          Deterministic 5-Step Security Audit
        </h3>

        <div className="space-y-3 font-sans">
          {/* Check 1: Digital RSA Signature */}
          <div className="p-4 border border-border flex items-start justify-between bg-white">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {data.signature_valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">
                  1. Digital RSA-PSS Signature
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {data.signature_valid
                    ? "Cryptographically validated using 2048-bit institutional public key. File bytes have not been tampered with."
                    : "Cryptographic signature check failed or signature payload is invalid."}
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase shrink-0 ${
                data.signature_valid ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {data.signature_valid ? "PASS" : "FAIL"}
            </span>
          </div>

          {/* Check 2: Database SHA-256 Hash Match */}
          <div className="p-4 border border-border flex items-start justify-between bg-white">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {data.hash_matched ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">
                  2. Institutional Registry Hash Match
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {data.hash_matched
                    ? `SHA-256 digest matches database record perfectly: ${
                        data.document_hash ? data.document_hash.slice(0, 16) + "..." : "Matched"
                      }`
                    : "No matching SHA-256 digest found in the institutional records repository."}
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase shrink-0 ${
                data.hash_matched ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {data.hash_matched ? "PASS" : "FAIL"}
            </span>
          </div>

          {/* Check 3: Current Approval Status */}
          <div className="p-4 border border-border flex items-start justify-between bg-white">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {data.status === "VALID" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">
                  3. Department Authorization State
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Current institutional authorization state:{" "}
                  <span className="font-mono font-semibold text-ink">
                    {data.status || "UNKNOWN"}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase shrink-0 ${
                data.status === "VALID"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {data.status === "VALID" ? "APPROVED" : data.status || "UNVERIFIED"}
            </span>
          </div>

          {/* Check 4: Supersession Status */}
          <div className="p-4 border border-border flex items-start justify-between bg-white">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {!isSuperseded ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">
                  4. Supersession & Version Check
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {isSuperseded
                    ? "Warning: A newer version of this permission letter has been issued. This document is no longer active."
                    : "This document represents the latest active authorization for this request version."}
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase shrink-0 ${
                !isSuperseded ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              {!isSuperseded ? "ACTIVE" : "SUPERSEDED"}
            </span>
          </div>

          {/* Check 5: On-Chain Sepolia Blockchain Confirmation */}
          <div className="p-4 border border-border flex items-start justify-between bg-white">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {data.blockchain?.is_registered ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Clock className="w-5 h-5 text-neutral-400" />
                )}
              </div>
              <div>
                <div className="text-xs font-semibold text-ink">
                  5. Ethereum Sepolia Smart Contract Anchor
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {data.blockchain?.is_registered ? (
                    <div>
                      <span>
                        Document hash notarized on Sepolia DocumentRegistry contract.
                      </span>
                      {data.blockchain.tx_hash && (
                        <div className="mt-1 flex items-center space-x-2 font-mono text-[11px]">
                          <span>Tx: {data.blockchain.tx_hash.slice(0, 18)}...</span>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${data.blockchain.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-signal-orange hover:underline inline-flex items-center"
                          >
                            View on Etherscan
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>
                      Blockchain confirmation is pending network confirmation or document was verified offline.
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 font-bold uppercase shrink-0 ${
                data.blockchain?.is_registered
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {data.blockchain?.is_registered ? "CONFIRMED" : "PENDING/LOCAL"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

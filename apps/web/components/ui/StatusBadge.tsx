import * as React from "react";
import { cn } from "@/lib/utils";

export type SystemStatus =
  | "PENDING"
  | "CORRECTION_REQUESTED"
  | "PARTIALLY_APPROVED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "BLOCKCHAIN_CONFIRMED"
  | "BLOCKCHAIN_PENDING"
  | "VERIFICATION_FAILED"
  | "VALID"
  | "SUPERSEDED"
  | "REVOKED";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: SystemStatus | string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const norm = status.toUpperCase().replace(/\s+/g, "_");

  let style = "bg-neutral-100 text-muted border-border";
  let label = norm.replace(/_/g, " ");

  switch (norm) {
    case "APPROVED":
    case "VALID":
      style = "bg-[#EBF5F0] text-[#237A50] border-[#B9E2CE]";
      label = "Approved";
      break;
    case "PARTIALLY_APPROVED":
      style = "bg-signal-tint text-signal-orange border-[#F5C7B3]";
      label = "Partially Approved";
      break;
    case "PENDING":
      style = "bg-[#FAF4E8] text-[#946318] border-[#EAD6A8]";
      label = "Pending Review";
      break;
    case "CORRECTION_REQUESTED":
      style = "bg-[#FAF4E8] text-[#946318] border-[#EAD6A8]";
      label = "Needs Correction";
      break;
    case "REJECTED":
    case "REVOKED":
    case "VERIFICATION_FAILED":
      style = "bg-[#FBEBEB] text-[#B83A32] border-[#F2B6B4]";
      label = norm === "REVOKED" ? "Revoked" : norm === "VERIFICATION_FAILED" ? "Verification Failed" : "Rejected";
      break;
    case "SUPERSEDED":
      style = "bg-neutral-100 text-[#70706B] border-border line-through";
      label = "Superseded";
      break;
    case "CANCELLED":
      style = "bg-neutral-100 text-[#70706B] border-border";
      label = "Cancelled";
      break;
    case "BLOCKCHAIN_CONFIRMED":
      style = "bg-graphite text-white border-graphite";
      label = "On-Chain Confirmed";
      break;
    case "BLOCKCHAIN_PENDING":
      style = "bg-neutral-100 text-ink border-border";
      label = "On-Chain Pending";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 border font-mono text-[11px] font-medium tracking-tight uppercase select-none rounded-[2px]",
        style,
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-none mr-1.5 bg-current opacity-80" />
      {label}
    </span>
  );
}

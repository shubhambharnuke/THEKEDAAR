"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Search,
  FileText,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import VerificationResult, {
  VerificationData,
} from "@/components/verification/VerificationResult";
import { useSession } from "@/lib/auth-client";

export default function VerifyPage() {
  const { data: sessionData } = useSession();
  const [activeTab, setActiveTab] = useState<"file" | "identifier">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("Only official PDF permission letters can be verified.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("Only official PDF permission letters can be verified.");
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      setLoading(true);

      const formData = new FormData();
      if (activeTab === "file") {
        if (!selectedFile) {
          setError("Please select or drop a PDF permission letter to verify.");
          setLoading(false);
          return;
        }
        formData.append("file", selectedFile);
      } else {
        const trimmed = identifier.trim();
        if (!trimmed) {
          setError("Please enter a valid Letter Identifier or SHA-256 Document Hash.");
          setLoading(false);
          return;
        }
        if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
          formData.append("document_hash", trimmed);
        } else {
          formData.append("letter_id", trimmed);
        }
      }

      const res = await fetch(`${apiUrl}/api/v1/documents/verify`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Verification request failed (${res.status})`);
      }

      const verificationData = await res.json();

      // Check blockchain status if hash is available
      let blockchainData = null;
      const docHash = verificationData.document_hash || (identifier.length === 64 ? identifier : null);

      if (docHash) {
        try {
          const bcRes = await fetch(`${apiUrl}/api/v1/blockchain/verify/${docHash}`);
          if (bcRes.ok) {
            const rawBc = await bcRes.json();
            blockchainData = {
              is_registered: !!rawBc.verified_on_chain,
              tx_hash: rawBc.details?.transaction_hash || null,
              block_number: rawBc.details?.block_number || null,
              timestamp: rawBc.details?.block_timestamp ? Math.floor(new Date(rawBc.details.block_timestamp).getTime() / 1000) : null,
              issuer: rawBc.details?.issuer_address || null,
              is_revoked: !!rawBc.details?.is_revoked,
              network: rawBc.network || "Ethereum Sepolia",
              message: rawBc.message,
            };
          }
        } catch {
          // On-chain check gracefully degrades if RPC is offline
        }
      }

      setResult({
        ...verificationData,
        document_hash: docHash,
        blockchain: blockchainData,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during document verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between selection:bg-neutral-200">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-mono uppercase tracking-wider text-muted hover:text-ink mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Portal
            </Link>
            <div className="h-4 w-[1px] bg-border"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-graphite flex items-center justify-center text-white font-mono font-bold text-xs">
                TK
              </div>
              <span className="font-mono text-xs tracking-wider text-graphite font-bold uppercase">
                Document Verification Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {sessionData?.user ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-muted hidden sm:inline">
                  Signed in as <strong className="text-ink">{sessionData.user.full_name}</strong>
                </span>
                <Link
                  href={
                    sessionData.user.role === "AUTHORITY"
                      ? "/authority/dashboard"
                      : sessionData.user.role === "ADMIN"
                      ? "/admin/audit"
                      : "/club/dashboard"
                  }
                  className="px-3 py-1.5 border border-graphite bg-graphite text-white text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 transition"
                >
                  Go to Dashboard &rarr;
                </Link>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-1.5 border border-border bg-white text-ink text-xs font-mono uppercase tracking-wider hover:bg-neutral-50 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-4xl mx-auto w-full px-6 py-12 flex-1">
        <div className="border border-border bg-white p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 border border-border bg-paper text-muted font-mono text-xs uppercase tracking-wider mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-signal-orange" />
              <span>Public Verification Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-ink tracking-tight">
              Verify Institutional Permission Letter
            </h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              Authenticate digital permission letters issued by college department authorities.
              The verification engine checks cryptographic RSA-PSS signatures, database approval records,
              supersession version history, and Ethereum Sepolia on-chain notary proofs.
            </p>
          </div>

          {/* Input Method Tabs */}
          <div className="mt-8 border-b border-border flex space-x-8">
            <button
              type="button"
              onClick={() => {
                setActiveTab("file");
                setError(null);
              }}
              className={`pb-3 text-xs font-mono uppercase tracking-wider border-b-2 font-medium transition ${
                activeTab === "file"
                  ? "border-signal-orange text-signal-orange"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Upload PDF Letter
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("identifier");
                setError(null);
              }}
              className={`pb-3 text-xs font-mono uppercase tracking-wider border-b-2 font-medium transition ${
                activeTab === "identifier"
                  ? "border-signal-orange text-signal-orange"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              Letter ID or Hash Lookup
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="mt-6">
            {activeTab === "file" ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed p-10 text-center cursor-pointer transition ${
                    selectedFile
                      ? "border-emerald-600 bg-emerald-50/20"
                      : "border-border hover:border-neutral-400 bg-paper"
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto text-muted mb-3" />
                  {selectedFile ? (
                    <div>
                      <span className="font-mono text-sm font-semibold text-ink block">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-muted mt-1 block">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull; Click or drag to replace
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-medium text-ink block">
                        Drag and drop official permission letter (PDF) here
                      </span>
                      <span className="text-xs text-muted mt-1 block">
                        or click to browse your local device
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                  Letter Identifier or Document SHA-256 Hash
                </label>
                <Input
                  name="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. PL-CSE-001 or 0x8f3c7b21e847..."
                />
                <p className="text-[11px] font-mono text-muted">
                  Enter the official reference code printed at the top of the letter, or the 64-character SHA-256 hash.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 border border-red-200 bg-red-50 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={loading} size="default">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating Cryptographic Proofs...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Verify Document
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Verification Outcome Component */}
        {result && <VerificationResult data={result} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs font-mono text-muted space-y-2 md:space-y-0">
          <div>THEKEDAR Institutional Verification &copy; 2026.</div>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

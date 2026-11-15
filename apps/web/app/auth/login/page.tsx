"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "@/lib/auth-client";
import { Users, Shield, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [roleTab, setRoleTab] = React.useState<"STUDENT_CLUB" | "AUTHORITY">("STUDENT_CLUB");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Invalid credentials. Please verify your email and password.");
        setLoading(false);
        return;
      }

      const userRole = res.data?.user?.role;
      if (userRole === "AUTHORITY") {
        router.push("/authority/dashboard");
      } else if (userRole === "ADMIN") {
        router.push("/admin/audit");
      } else if (userRole === "VERIFIER") {
        router.push("/verify");
      } else {
        router.push("/club/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center p-4 selection:bg-neutral-200">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-graphite text-white font-mono font-bold text-sm mb-3">
            TK
          </div>
          <h2 className="text-2xl font-semibold text-ink tracking-tight font-sans">
            Institutional Sign In
          </h2>
          <p className="text-xs text-muted font-mono mt-1 uppercase tracking-wider">
            Resource Booking & Digital Permission System
          </p>
        </div>

        {/* Dual Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setRoleTab("STUDENT_CLUB");
              setError(null);
            }}
            className={`p-3 text-left border transition rounded-[2px] flex items-center space-x-2.5 ${
              roleTab === "STUDENT_CLUB"
                ? "border-graphite bg-white shadow-sm"
                : "border-border bg-neutral-50/50 text-muted hover:bg-white"
            }`}
          >
            <div
              className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                roleTab === "STUDENT_CLUB"
                  ? "bg-graphite text-white"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                Student Club
              </div>
              <div className="text-[11px] text-muted font-sans">Events & bookings</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab("AUTHORITY");
              setError(null);
            }}
            className={`p-3 text-left border transition rounded-[2px] flex items-center space-x-2.5 ${
              roleTab === "AUTHORITY"
                ? "border-signal-orange bg-white shadow-sm"
                : "border-border bg-neutral-50/50 text-muted hover:bg-white"
            }`}
          >
            <div
              className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                roleTab === "AUTHORITY"
                  ? "bg-signal-orange text-white"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                Authority
              </div>
              <div className="text-[11px] text-muted font-sans">Deans & Dept Heads</div>
            </div>
          </button>
        </div>

        {/* Login Box */}
        <div className="bg-white border border-border p-6 shadow-none rounded-[3px]">
          <div className="mb-4 pb-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono text-muted uppercase">
              Logging in as:{" "}
              <strong className="text-ink">
                {roleTab === "STUDENT_CLUB" ? "Student Organization" : "Administrative Authority"}
              </strong>
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
                Institutional Email
              </label>
              <Input
                type="email"
                placeholder={
                  roleTab === "STUDENT_CLUB" ? "acm.lead@college.edu" : "dean.sw@college.edu"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-ink font-mono uppercase tracking-wider">
                  Password
                </label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-3" isLoading={loading}>
              Sign In as {roleTab === "STUDENT_CLUB" ? "Club Lead" : "Authority"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono">
            <span className="text-muted">Need an account?</span>
            <Link
              href={`/auth/register?role=${roleTab}`}
              className="text-signal-orange hover:underline font-semibold flex items-center"
            >
              Register here <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted font-mono">
          <Link href="/" className="hover:text-ink transition">
            &larr; Return to Institutional Home
          </Link>
        </div>
      </div>
    </div>
  );
}

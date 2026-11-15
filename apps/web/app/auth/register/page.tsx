"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signUp } from "@/lib/auth-client";
import { thekedarApi } from "@/lib/api";
import { Users, Shield, ArrowRight, Building } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "AUTHORITY" ? "AUTHORITY" : "STUDENT_CLUB";

  const [roleTab, setRoleTab] = React.useState<"STUDENT_CLUB" | "AUTHORITY">(initialRole);
  const [fullName, setFullName] = React.useState("");
  const [clubName, setClubName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [selectedDeptId, setSelectedDeptId] = React.useState<number | null>(null);
  const [departments, setDepartments] = React.useState<Array<{ id: number; name: string; code: string }>>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    thekedarApi
      .getDepartments()
      .then((data) => {
        if (data && data.length > 0) {
          setDepartments(data);
          setSelectedDeptId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signUp.email({
        name: fullName,
        email,
        password,
        role: roleTab,
        department_id: roleTab === "AUTHORITY" ? selectedDeptId : null,
        club_name: roleTab === "STUDENT_CLUB" ? clubName : null,
      });

      if (res.error) {
        setError(res.error.message || "Failed to register account. Please check inputs.");
        setLoading(false);
        return;
      }

      if (roleTab === "AUTHORITY") {
        router.push("/authority/dashboard");
      } else {
        router.push("/club/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during account creation.");
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
            Institutional Account Registration
          </h2>
          <p className="text-xs text-muted font-mono mt-1 uppercase tracking-wider">
            Create Access Credentials for the Permission Portal
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
              <div className="text-[11px] text-muted font-sans">Register as Club Lead</div>
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
              <div className="text-[11px] text-muted font-sans">Dean / Department Head</div>
            </div>
          </button>
        </div>

        {/* Form Box */}
        <div className="bg-white border border-border p-6 shadow-none rounded-[3px]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
                {roleTab === "STUDENT_CLUB" ? "Club Representative Name" : "Official Full Name"}
              </label>
              <Input
                type="text"
                placeholder={roleTab === "STUDENT_CLUB" ? "Aarav Patel" : "Dr. Sarah Jenkins"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {roleTab === "STUDENT_CLUB" && (
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
                  Club / Organization Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. ACM Student Chapter, Robotics Club"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  required
                />
              </div>
            )}

            {roleTab === "AUTHORITY" && (
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
                  Associated Institutional Department
                </label>
                <div className="relative">
                  <select
                    value={selectedDeptId || ""}
                    onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-white border border-border text-ink text-xs font-mono rounded-[2px] focus:outline-none focus:ring-1 focus:ring-graphite"
                    required
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
                Institutional Email Address
              </label>
              <Input
                type="email"
                placeholder={
                  roleTab === "STUDENT_CLUB" ? "club@college.edu" : "dean@college.edu"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase tracking-wider">
                Master Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-3" isLoading={loading}>
              Complete {roleTab === "STUDENT_CLUB" ? "Club" : "Authority"} Registration
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-mono">
            <span className="text-muted">Already registered?</span>
            <Link
              href={`/auth/login`}
              className="text-signal-orange hover:underline font-semibold flex items-center"
            >
              Sign In here <ArrowRight className="w-3 h-3 ml-1" />
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

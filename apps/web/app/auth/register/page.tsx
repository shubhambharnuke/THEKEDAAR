"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signUp.email({
        name: fullName,
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Failed to register account. Please check inputs.");
        setLoading(false);
        return;
      }

      router.push("/club/dashboard");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during account creation.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-graphite text-white font-mono font-bold text-sm mb-3">
            TK
          </div>
          <h2 className="text-2xl font-semibold text-ink tracking-tight">Create Club Account</h2>
          <p className="text-xs text-muted font-mono mt-1 uppercase">Institutional Access Registration</p>
        </div>

        <div className="bg-white border border-border p-6 shadow-none rounded-[3px]">
          {error && (
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase">
                Organization / Lead Name
              </label>
              <Input
                type="text"
                placeholder="ACM Student Chapter"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase">
                Institutional Email
              </label>
              <Input
                type="email"
                placeholder="club@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 font-mono uppercase">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              Register Organization
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted font-mono">
            Already registered?{" "}
            <Link href="/auth/login" className="text-signal-orange hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

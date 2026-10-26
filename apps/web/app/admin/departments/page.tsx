"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Building,
  Plus,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
} from "lucide-react";

interface Department {
  id: number;
  name: string;
  code: string;
  contact_email: string;
  created_at?: string;
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/v1/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        setDepartments([
          {
            id: 1,
            name: "Office of Student Welfare",
            code: "SW",
            contact_email: "sw@college.edu",
          },
          {
            id: 2,
            name: "Estate & Venues Directorate",
            code: "EST",
            contact_email: "estate@college.edu",
          },
          {
            id: 3,
            name: "Department of Computer Science & Engineering",
            code: "CSE",
            contact_email: "cse.hod@college.edu",
          },
          {
            id: 4,
            name: "Department of Physical Education",
            code: "PE",
            contact_email: "sports@college.edu",
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load departments catalogue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim() || !contactEmail.trim()) {
      setError("Please complete all department fields.");
      return;
    }

    try {
      setCreating(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/v1/admin/departments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          contact_email: contactEmail.trim(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to create department");
      }

      const created = await res.json();
      setDepartments((prev) => [...prev, created]);
      setSuccessMsg(`Department '${created.name}' (${created.code}) created successfully.`);
      setCreateModalOpen(false);
      setName("");
      setCode("");
      setContactEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell userRole="ADMIN" userName="System Administrator" userEmail="admin@college.edu">
      <div className="space-y-6">
        <div className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-muted uppercase tracking-wider mb-1">
              <Building className="w-3.5 h-3.5 text-signal-orange" />
              <span>Administrative Catalog</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              Department Management
            </h1>
            <p className="text-xs text-muted mt-1">
              Configure academic branches and operational administrative bodies responsible for resource authority.
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Department
          </Button>
        </div>

        {successMsg && (
          <div className="p-4 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted font-mono text-xs">
              <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
              Loading institutional departments...
            </div>
          ) : departments.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted text-xs">
              No departments registered in catalog.
            </div>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="border border-border bg-white p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-paper border border-border text-graphite">
                      {dept.code}
                    </span>
                    <span className="text-[10px] font-mono text-muted">ID #{dept.id}</span>
                  </div>
                  <h3 className="font-semibold text-ink text-base">{dept.name}</h3>
                  <div className="mt-4 flex items-center space-x-2 text-xs text-muted">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-mono text-[11px] truncate">{dept.contact_email}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-[11px] font-mono text-muted">
                  <span>Authorizing Node</span>
                  <span className="text-emerald-700 font-semibold">Active In System</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Department Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="border border-border bg-white w-full max-w-md p-6 shadow-xl animate-in fade-in-50">
              <div className="flex justify-between items-start pb-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-ink text-base">Register New Department</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Add an institutional department to handle approval queues.
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-muted hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                    Department Full Name
                  </label>
                  <Input
                    placeholder="e.g. Office of Student Welfare"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                    Department Code
                  </label>
                  <Input
                    placeholder="e.g. SW or CSE"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                  <p className="text-[10px] font-mono text-muted">Used for permission letter prefixes.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                    Contact Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="sw@college.edu"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Department"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Users,
  Search,
  Filter,
  Edit2,
  Shield,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: "STUDENT_CLUB" | "AUTHORITY" | "VERIFIER" | "ADMIN";
  department_id?: number | null;
  department_name?: string | null;
  is_active: boolean;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit form state
  const [editRole, setEditRole] = useState<string>("");
  const [editDeptId, setEditDeptId] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchUsersAndDepts = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [usersRes, deptsRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/admin/users`, { headers }),
        fetch(`${apiUrl}/api/v1/departments`, { credentials: "omit" }),
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData);
      } else {
        // Fallback default mock data if not yet authenticated
        setUsers([
          {
            id: 1,
            email: "admin@college.edu",
            full_name: "Registrar Office Administrator",
            role: "ADMIN",
            department_name: "Central Administration",
            is_active: true,
          },
          {
            id: 2,
            email: "sw@college.edu",
            full_name: "Dr. Ananya Sharma",
            role: "AUTHORITY",
            department_id: 1,
            department_name: "Office of Student Welfare",
            is_active: true,
          },
          {
            id: 3,
            email: "estate@college.edu",
            full_name: "Mr. Rajesh Kumar",
            role: "AUTHORITY",
            department_id: 2,
            department_name: "Estate & Venues Directorate",
            is_active: true,
          },
          {
            id: 4,
            email: "robotics@college.edu",
            full_name: "Robotics Club President",
            role: "STUDENT_CLUB",
            department_name: "Student Body",
            is_active: true,
          },
          {
            id: 5,
            email: "security@college.edu",
            full_name: "Campus Main Gate Guardhouse",
            role: "VERIFIER",
            department_name: "Campus Security",
            is_active: true,
          },
        ]);
      }

      if (deptsRes.ok) {
        const dData = await deptsRes.json();
        setDepartments(dData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load users catalogue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDepts();
  }, []);

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditDeptId(user.department_id || 0);
    setEditIsActive(user.is_active);
    setError(null);
    setSuccessMsg(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setUpdating(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/v1/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          role: editRole,
          department_id: editDeptId,
          is_active: editIsActive,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to update user profile");
      }

      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSuccessMsg(`User '${updated.full_name}' role and parameters updated successfully.`);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department_name && u.department_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <AppShell userRole="ADMIN" userName="System Administrator" userEmail="admin@college.edu">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-muted uppercase tracking-wider mb-1">
              <Shield className="w-3.5 h-3.5 text-signal-orange" />
              <span>Administrative Console</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              User & Role Assignment Management
            </h1>
            <p className="text-xs text-muted mt-1">
              Assign institutional privileges, map authority accounts to academic departments, and manage campus logins.
            </p>
          </div>
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

        {/* Filter Controls */}
        <div className="border border-border bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex-1 w-full md:max-w-md">
            <Input
              placeholder="Search by name, institutional email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-border bg-white px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT_CLUB">Student Club</option>
              <option value="AUTHORITY">Authority</option>
              <option value="VERIFIER">Verifier</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-paper font-mono text-[11px] text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Institutional Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Department Affiliation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted font-mono">
                      <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
                      Loading user directory...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted">
                      No institutional users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-50/60 transition">
                      <td className="py-3.5 px-4 font-medium text-ink">
                        {u.full_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block font-mono text-[10px] uppercase px-2 py-0.5 rounded-[2px] font-semibold ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : u.role === "AUTHORITY"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : u.role === "VERIFIER"
                              ? "bg-blue-100 text-blue-900 border border-blue-200"
                              : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted">
                        {u.department_name ? (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{u.department_name}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 font-mono text-[10px] uppercase px-1.5 py-0.5 ${
                            u.is_active
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-red-700 bg-red-50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? "bg-emerald-600" : "bg-red-600"
                            }`}
                          ></span>
                          <span>{u.is_active ? "Active" : "Disabled"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditModal(u)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit Role
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Role Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="border border-border bg-white w-full max-w-lg p-6 shadow-xl animate-in fade-in-50">
              <div className="flex justify-between items-start pb-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-ink text-base">
                    Edit User Role & Affiliation
                  </h3>
                  <p className="text-xs text-muted font-mono mt-0.5">
                    {editingUser.full_name} ({editingUser.email})
                  </p>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-muted hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1">
                    System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full border border-border bg-white px-3 py-2 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
                  >
                    <option value="STUDENT_CLUB">STUDENT_CLUB (Event Applicant)</option>
                    <option value="AUTHORITY">AUTHORITY (Department Decision Maker)</option>
                    <option value="VERIFIER">VERIFIER (Security Gatekeeper / Checker)</option>
                    <option value="ADMIN">ADMIN (System & Resource Administrator)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1">
                    Department Affiliation
                  </label>
                  <select
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(Number(e.target.value))}
                    className="w-full border border-border bg-white px-3 py-2 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
                  >
                    <option value={0}>None / General Campus</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted font-mono mt-1">
                    Required for AUTHORITY roles to review pending requests for their department.
                  </p>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 text-signal-orange rounded border-border focus:ring-signal-orange"
                  />
                  <label htmlFor="userActive" className="text-xs text-ink font-medium select-none">
                    Active Account (Uncheck to suspend login privileges)
                  </label>
                </div>

                <div className="pt-4 border-t border-border flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? "Saving..." : "Save Role Assignment"}
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

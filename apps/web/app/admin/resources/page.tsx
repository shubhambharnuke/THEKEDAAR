"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Calendar,
  Plus,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Power,
  Layers,
  MapPin,
  Users,
} from "lucide-react";

interface ResourceItem {
  id: number;
  department_id: number;
  name: string;
  code: string;
  resource_type: string;
  location: string;
  capacity: number;
  equipment_spec?: string | null;
  is_active: boolean;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterDept, setFilterDept] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDeptId, setNewDeptId] = useState<number>(0);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("AUDITORIUM");
  const [newLocation, setNewLocation] = useState("");
  const [newCapacity, setNewCapacity] = useState<number>(100);
  const [newEquipment, setNewEquipment] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRes, deptRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/resources`),
        fetch(`${apiUrl}/api/v1/departments`),
      ]);

      if (resRes.ok) {
        const rData = await resRes.json();
        setResources(rData);
      } else {
        setResources([
          {
            id: 1,
            department_id: 1,
            name: "Main Auditorium (Dr. APJ Abdul Kalam Hall)",
            code: "AUD-01",
            resource_type: "AUDITORIUM",
            location: "Academic Block A, Ground Floor",
            capacity: 800,
            equipment_spec: "Full acoustic line-array audio, Christie 4K Projector, Stage lighting",
            is_active: true,
          },
          {
            id: 2,
            department_id: 1,
            name: "Seminar Hall 1",
            code: "SEM-01",
            resource_type: "SEMINAR_HALL",
            location: "Academic Block B, Level 2",
            capacity: 150,
            equipment_spec: "Dual wireless mics, overhead motorized projector",
            is_active: true,
          },
          {
            id: 3,
            department_id: 3,
            name: "High Performance Computing Lab",
            code: "LAB-HPC",
            resource_type: "LAB",
            location: "CS Block, Room 302",
            capacity: 60,
            equipment_spec: "60 Workstations, CUDA Cluster, gigabit LAN",
            is_active: true,
          },
          {
            id: 4,
            department_id: 4,
            name: "Football Stadium Turf",
            code: "FLD-FB",
            resource_type: "GROUND",
            location: "Sports Complex East",
            capacity: 2000,
            equipment_spec: "Floodlight towers, referee dugout, PA system",
            is_active: true,
          },
        ]);
      }

      if (deptRes.ok) {
        const dData = await deptRes.json();
        setDepartments(dData);
        if (dData.length > 0) {
          setNewDeptId(dData[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resources catalogue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (resource: ResourceItem) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/v1/admin/resources/${resource.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          is_active: !resource.is_active,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update resource active state");
      }

      const updated = await res.json();
      setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSuccessMsg(
        `Resource '${updated.name}' is now ${updated.is_active ? "active" : "deactivated"}.`
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newName.trim() || !newCode.trim() || !newLocation.trim() || newDeptId <= 0) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setCreating(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/v1/admin/resources`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          department_id: newDeptId,
          name: newName.trim(),
          code: newCode.trim().toUpperCase(),
          resource_type: newType,
          location: newLocation.trim(),
          capacity: Number(newCapacity),
          equipment_spec: newEquipment.trim() || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to create resource");
      }

      const created = await res.json();
      setResources((prev) => [...prev, created]);
      setSuccessMsg(`Resource '${created.name}' (${created.code}) created successfully.`);
      setCreateModalOpen(false);
      setNewName("");
      setNewCode("");
      setNewLocation("");
      setNewCapacity(100);
      setNewEquipment("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const getDeptName = (deptId: number) => {
    const d = departments.find((dept) => dept.id === deptId);
    return d ? d.name : `Dept #${deptId}`;
  };

  const filteredResources = resources.filter((r) => {
    const matchesDept = filterDept === "ALL" || r.department_id.toString() === filterDept;
    const matchesType = filterType === "ALL" || r.resource_type === filterType;
    return matchesDept && matchesType;
  });

  return (
    <AppShell userRole="ADMIN" userName="System Administrator" userEmail="admin@college.edu">
      <div className="space-y-6">
        <div className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-muted uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5 text-signal-orange" />
              <span>Institutional Inventory</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              Resource Management
            </h1>
            <p className="text-xs text-muted mt-1">
              Add campus venues, auditoriums, and labs. Deactivate resources for maintenance or quarantine.
            </p>
          </div>

          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Resource
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

        {/* Filters */}
        <div className="border border-border bg-white p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">Department:</span>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="border border-border bg-white px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id.toString()}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-border bg-white px-3 py-1.5 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
              >
                <option value="ALL">All Types</option>
                <option value="AUDITORIUM">Auditorium</option>
                <option value="LAB">Laboratory</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="SEMINAR_HALL">Seminar Hall</option>
                <option value="GROUND">Ground / Field</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-mono text-muted">
            {filteredResources.length} {filteredResources.length === 1 ? "resource" : "resources"} found
          </div>
        </div>

        {/* Resources Table */}
        <div className="border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-paper font-mono text-[11px] text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Resource Name</th>
                  <th className="py-3 px-4">Responsible Department</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Operational Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted font-mono">
                      <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
                      Loading resource inventory...
                    </td>
                  </tr>
                ) : filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted">
                      No matching resources registered.
                    </td>
                  </tr>
                ) : (
                  filteredResources.map((res) => (
                    <tr key={res.id} className="hover:bg-neutral-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-graphite">
                        {res.code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-ink">
                        {res.name}
                      </td>
                      <td className="py-3.5 px-4 text-muted">
                        {getDeptName(res.department_id)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] uppercase text-muted">
                        {res.resource_type.replace("_", " ")}
                      </td>
                      <td className="py-3.5 px-4 text-muted">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{res.location}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-ink">
                        {res.capacity} pax
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 font-mono text-[10px] uppercase px-1.5 py-0.5 ${
                            res.is_active
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-red-700 bg-red-50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              res.is_active ? "bg-emerald-600" : "bg-red-600"
                            }`}
                          ></span>
                          <span>{res.is_active ? "Active" : "Deactivated"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={res.is_active ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => handleToggleActive(res)}
                        >
                          <Power className="w-3 h-3 mr-1" />
                          {res.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Resource Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="border border-border bg-white w-full max-w-lg p-6 shadow-xl animate-in fade-in-50">
              <div className="flex justify-between items-start pb-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-ink text-base">Register New Resource</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Add a bookable venue or laboratory to the institutional inventory.
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-muted hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateResource} className="mt-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                    Responsible Department
                  </label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(Number(e.target.value))}
                    className="w-full border border-border bg-white px-3 py-2 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                    Resource Name
                  </label>
                  <Input
                    placeholder="e.g. Electrical Engineering Seminar Hall"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                      Resource Code
                    </label>
                    <Input
                      placeholder="e.g. EE-SEM"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                      Category
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full border border-border bg-white px-3 py-2 text-xs text-ink font-mono focus:outline-none focus:ring-1 focus:ring-signal-orange rounded-[3px]"
                    >
                      <option value="AUDITORIUM">Auditorium</option>
                      <option value="LAB">Laboratory</option>
                      <option value="CLASSROOM">Classroom</option>
                      <option value="SEMINAR_HALL">Seminar Hall</option>
                      <option value="GROUND">Ground / Field</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                      Physical Location
                    </label>
                    <Input
                      placeholder="e.g. Academic Block C, 3rd Floor"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                      Capacity (pax)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={newCapacity}
                      onChange={(e) => setNewCapacity(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono uppercase tracking-wider text-muted">
                    Equipment Specifications
                  </label>
                  <Input
                    placeholder="e.g. Projector, wireless mics, podium, AC"
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
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
                    {creating ? "Creating..." : "Save Resource"}
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

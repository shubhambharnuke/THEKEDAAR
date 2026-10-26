"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeft, ArrowRight, Check, CheckCircle, AlertTriangle, Building, Calendar, Clock, Trash2 } from "lucide-react";

interface ResourceOption {
  id: number;
  name: string;
  code: string;
  department_name: string;
  department_id: number;
  capacity: number;
  location: string;
}

interface SelectedResourceItem {
  resource_id: number;
  resource_name: string;
  resource_code: string;
  department_name: string;
  department_id: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
}

const AVAILABLE_RESOURCES: ResourceOption[] = [
  {
    id: 1,
    name: "Dr. APJ Abdul Kalam Main Auditorium",
    code: "AUDI_MAIN",
    department_name: "Dean of Student Welfare",
    department_id: 2,
    capacity: 800,
    location: "Central Campus, Building A",
  },
  {
    id: 2,
    name: "Mini Auditorium",
    code: "AUDI_MINI",
    department_name: "Dean of Student Welfare",
    department_id: 2,
    capacity: 250,
    location: "Student Activity Center",
  },
  {
    id: 3,
    name: "Sir Visvesvaraya Seminar Hall A",
    code: "SEM_HALL_A",
    department_name: "Dean of Academic Affairs",
    department_id: 1,
    capacity: 120,
    location: "Academic Complex, 3rd Floor",
  },
  {
    id: 4,
    name: "Advanced Computing & AI Lab",
    code: "LAB_COMP_301",
    department_name: "Department of Computer Engineering",
    department_id: 3,
    capacity: 60,
    location: "Computer Dept, Room 301",
  },
  {
    id: 5,
    name: "Smart Classroom 101",
    code: "ROOM_101",
    department_name: "Dean of Academic Affairs",
    department_id: 1,
    capacity: 70,
    location: "Main Block, 1st Floor",
  },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Step 1: Event Details
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [expectedAttendance, setExpectedAttendance] = React.useState(100);

  // Step 2: Resource Selection
  const [selectedResources, setSelectedResources] = React.useState<SelectedResourceItem[]>([]);
  const [activeResourceId, setActiveResourceId] = React.useState<number>(1);
  const [slotDate, setSlotDate] = React.useState("2026-11-05");
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("13:00");
  const [availabilityMessage, setAvailabilityMessage] = React.useState<string | null>(null);

  // Step 3: Submitting
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAddResource = () => {
    const res = AVAILABLE_RESOURCES.find((r) => r.id === activeResourceId);
    if (!res) return;

    const startISO = `${slotDate}T${startTime}:00Z`;
    const endISO = `${slotDate}T${endTime}:00Z`;

    // Check duplicate
    if (selectedResources.some((r) => r.resource_id === res.id && r.start_time === startISO)) {
      setAvailabilityMessage("This resource is already added for this start time.");
      return;
    }

    setSelectedResources([
      ...selectedResources,
      {
        resource_id: res.id,
        resource_name: res.name,
        resource_code: res.code,
        department_name: res.department_name,
        department_id: res.department_id,
        start_time: startISO,
        end_time: endISO,
        is_available: true,
      },
    ]);
    setAvailabilityMessage(null);
  };

  const handleRemoveResource = (index: number) => {
    setSelectedResources(selectedResources.filter((_, i) => i !== index));
  };

  const handleSubmitEvent = async () => {
    setError(null);
    setSubmitting(true);

    try {
      // In development / demo mode, redirect to mock created event
      setTimeout(() => {
        router.push("/club/events/1");
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Failed to submit event request.");
      setSubmitting(false);
    }
  };

  // Group by department for Step 3 review
  const groupedByDept = selectedResources.reduce((acc, item) => {
    if (!acc[item.department_name]) {
      acc[item.department_name] = [];
    }
    acc[item.department_name].push(item);
    return acc;
  }, {} as Record<string, SelectedResourceItem[]>);

  return (
    <AppShell userRole="STUDENT_CLUB" userName="ACM Chapter Lead" userEmail="acm.lead@college.edu">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center space-x-2 text-xs font-mono text-muted">
          <Link href="/club/dashboard" className="hover:text-ink">
            My Events
          </Link>
          <span>/</span>
          <span className="text-ink">Create Event Request</span>
        </div>

        {/* Wizard Step Indicator */}
        <div className="border border-border bg-white p-4 rounded-[3px]">
          <div className="flex justify-between items-center text-xs font-mono">
            <div className={`flex items-center ${step === 1 ? "text-signal-orange font-bold" : "text-muted"}`}>
              <span className="w-5 h-5 flex items-center justify-center border border-current mr-2 rounded-[2px]">
                1
              </span>
              <span>1. Event Specifications</span>
            </div>
            <div className="w-12 h-px bg-border hidden sm:block" />
            <div className={`flex items-center ${step === 2 ? "text-signal-orange font-bold" : "text-muted"}`}>
              <span className="w-5 h-5 flex items-center justify-center border border-current mr-2 rounded-[2px]">
                2
              </span>
              <span>2. Resource Selection & Timing</span>
            </div>
            <div className="w-12 h-px bg-border hidden sm:block" />
            <div className={`flex items-center ${step === 3 ? "text-signal-orange font-bold" : "text-muted"}`}>
              <span className="w-5 h-5 flex items-center justify-center border border-current mr-2 rounded-[2px]">
                3
              </span>
              <span>3. Review & Multi-Dept Split</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono">
            {error}
          </div>
        )}

        {/* STEP 1: EVENT DETAILS */}
        {step === 1 && (
          <div className="bg-white border border-border p-6 space-y-5 rounded-[3px]">
            <div>
              <h2 className="text-base font-semibold text-ink font-sans">Event Details</h2>
              <p className="text-xs text-muted font-mono mt-0.5">
                Provide official event context and attendance expectations
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-ink mb-1.5 font-medium">
                  Event Title *
                </label>
                <Input
                  placeholder="e.g. Annual Technical Symposium & Project Exhibition"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink mb-1.5 font-medium">
                  Expected Attendance *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="2000"
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-ink mb-1.5 font-medium">
                  Event Scope & Requirements
                </label>
                <Textarea
                  placeholder="Detail event schedule, VIP guests, specialized equipment or internet requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <Button
                variant="primary"
                disabled={!title.trim()}
                onClick={() => setStep(2)}
              >
                Proceed to Resource Selection
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: RESOURCE SELECTION */}
        {step === 2 && (
          <div className="bg-white border border-border p-6 space-y-6 rounded-[3px]">
            <div>
              <h2 className="text-base font-semibold text-ink font-sans">Select Resources & Time Slots</h2>
              <p className="text-xs text-muted font-mono mt-0.5">
                Choose rooms or auditoriums across departments. Check real-time schedule conflicts.
              </p>
            </div>

            {/* Selector Grid */}
            <div className="p-4 bg-paper border border-border rounded-[3px] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink mb-1.5">
                    Target Facility
                  </label>
                  <select
                    className="w-full h-9 border border-border bg-white px-3 text-xs md:text-sm text-ink rounded-[3px] focus:outline-none focus:border-signal-orange"
                    value={activeResourceId}
                    onChange={(e) => setActiveResourceId(Number(e.target.value))}
                  >
                    {AVAILABLE_RESOURCES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code}) — {r.department_name} [Cap: {r.capacity}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-ink mb-1.5">Date</label>
                  <Input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink mb-1.5">Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-ink mb-1.5">End Time</label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {availabilityMessage && (
                <div className="p-2.5 bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs font-mono flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                  {availabilityMessage}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleAddResource}>
                  Add to Request List
                </Button>
              </div>
            </div>

            {/* Selected Resource List */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase text-muted tracking-wider">
                Currently Selected Resources ({selectedResources.length})
              </h3>

              {selectedResources.length === 0 ? (
                <div className="p-6 border border-dashed border-border text-center text-xs text-muted font-mono">
                  No resources added yet. Select a facility above and click "Add to Request List".
                </div>
              ) : (
                <div className="border border-border divide-y divide-border rounded-[3px]">
                  {selectedResources.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between bg-white text-xs">
                      <div>
                        <div className="font-semibold text-ink font-sans">{item.resource_name}</div>
                        <div className="text-muted font-mono text-[11px] mt-0.5">
                          {item.department_name} | {item.start_time.replace("T", " ").replace("Z", "")} to{" "}
                          {item.end_time.replace("T", " ").replace("Z", "")}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2 py-0.5 bg-[#EBF5F0] text-[#237A50] font-mono text-[10px] uppercase">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Slot Available
                        </span>
                        <button
                          onClick={() => handleRemoveResource(idx)}
                          className="text-muted hover:text-status-error transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Details
              </Button>
              <Button
                variant="primary"
                disabled={selectedResources.length === 0}
                onClick={() => setStep(3)}
              >
                Review Department Grouping
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & DECOMPOSE */}
        {step === 3 && (
          <div className="bg-white border border-border p-6 space-y-6 rounded-[3px]">
            <div>
              <h2 className="text-base font-semibold text-ink font-sans">Review Multi-Department Split</h2>
              <p className="text-xs text-muted font-mono mt-0.5">
                The system will automatically decompose this request by department authority.
              </p>
            </div>

            {/* Overview Summary */}
            <div className="p-4 bg-paper border border-border rounded-[3px] text-xs font-mono space-y-1.5">
              <div><b>Event:</b> {title}</div>
              <div><b>Expected Attendance:</b> {expectedAttendance} attendees</div>
              <div><b>Governing Departments:</b> {Object.keys(groupedByDept).length} independent authorities</div>
            </div>

            {/* Department Breakdown Cards */}
            <div className="space-y-4">
              {Object.entries(groupedByDept).map(([deptName, items], idx) => (
                <div key={idx} className="border border-border p-4 bg-white rounded-[3px] space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-signal-orange" />
                      <span className="font-semibold text-xs md:text-sm font-sans text-ink">
                        {deptName}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted uppercase">
                      Sub-Request #{idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <div key={i} className="text-xs flex justify-between text-muted font-mono">
                        <span>• {item.resource_name} ({item.resource_code})</span>
                        <span>{item.start_time.slice(11, 16)} - {item.end_time.slice(11, 16)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Back to Selection
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitEvent}
                isLoading={submitting}
              >
                Submit Event for Institutional Approvals
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

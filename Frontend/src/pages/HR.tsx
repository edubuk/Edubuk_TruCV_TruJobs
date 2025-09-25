// HRDashboardWithBackend.tsx
import React, { useEffect, useState } from "react";

type Job = {
  _id?: string; // backend uses _id
  id?: string;
  title: string;
  company: string;
  location?: string;
  role?: string;
  description: string;
  postedAt?: string;
  employmentType?: string;
  isRemote?: boolean;
  salary?: any;
  applyUrl?: string[];
  tags?: string[];
  postedBy?: any;
};

type Applicant = {
  id: string;
  name: string;
  resumeUrl: string;
  appliedAt: string;
  matchingScore: number;
  snippet?: string;
};

type HRStatus = "approved" | "pending" | "rejected" | null;

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function HRDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Record<string, Applicant[]>>({});
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState<any>({
    title: "",
    company: "",
    location: "",
    role: "",
    employmentType: "full-time",
    isRemote: false,
    salaryMode: "structured", // "structured" or "text"
    salary: { min: undefined, max: undefined, currency: "INR" },
    salaryText: "",
    description: "",
    applyUrl: "",
    tags: ""
  });

  // HR and status
  const [hrStatus, setHrStatus] = useState<HRStatus>(null);
  const [hr, setHr] = useState<any>(null);
  const [hrLoading, setHrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // load existing jobs (public)
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs?limit=50`);
        if (res.ok) {
          const data = await res.json();
          // backend returns { jobs: [...] } per earlier controllers
          const list = data.jobs || data;
          setJobs(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("fetchJobs error", err);
      }
    };

    fetchJobs();

    // fetch HR profile
    const fetchHrStatus = async () => {
      const token = localStorage.getItem("googleIdToken");
      if (!token) return;
      setHrLoading(true);
      try {
        const res = await fetch(`${API_BASE}/hr/me`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          console.log("data", data);
          const hrData = data.hr || data;
          setHr(hrData);
          setHrStatus(hrData.status);
        } else {
          setHr(null);
          setHrStatus(null);
        }
      } catch (err) {
        console.error("hr/me error", err);
        setHr(null);
        setHrStatus(null);
      } finally {
        setHrLoading(false);
      }
    };

    fetchHrStatus();
  }, []);

  function openPostModal(forEdit?: Job) {
    setEditingJob(forEdit || null);
    if (forEdit) {
      setForm({
        title: forEdit.title || "",
        company: forEdit.company || (hr?.companyName || ""),
        location: forEdit.location || "",
        role: forEdit.role || "",
        employmentType: forEdit.employmentType || "full-time",
        isRemote: !!forEdit.isRemote,
        salaryMode: typeof forEdit.salary === "string" ? "text" : "structured",
        salary: typeof forEdit.salary === "object" ? forEdit.salary : { min: undefined, max: undefined, currency: "INR" },
        salaryText: typeof forEdit.salary === "string" ? forEdit.salary : "",
        description: forEdit.description || "",
        applyUrl: (forEdit.applyUrl || []).join(", "),
        tags: (forEdit.tags || []).join(", ")
      });
    } else {
      setForm({
        title: "",
        company: hr?.companyName || "",
        location: "",
        role: "",
        employmentType: "full-time",
        isRemote: false,
        salaryMode: "structured",
        salary: { min: undefined, max: undefined, currency: "INR" },
        salaryText: "",
        description: "",
        applyUrl: "",
        tags: ""
      });
    }
    setShowPostModal(true);
  }

  function closePostModal() {
    setShowPostModal(false);
    setEditingJob(null);
    setErrorMsg(null);
  }

  // Save (create) job -> POST /jobs
  async function saveJob(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMsg(null);

    // require HR approved
    if (hrStatus !== "approved") {
      setErrorMsg("Only approved HR accounts can post jobs.");
      return;
    }

    // basic client-side validation
    if (!form.title || !form.company || !form.description) {
      setErrorMsg("Please fill title, company and description.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("googleIdToken");
    try {
      const payload: any = {
        title: form.title,
        company: form.company,
        location: form.location,
        role: form.role,
        employmentType: form.employmentType,
        isRemote: !!form.isRemote,
        description: form.description,
        applyUrl: form.applyUrl ? form.applyUrl.split(",").map((s:string)=>s.trim()).filter(Boolean) : [],
        tags: form.tags ? form.tags.split(",").map((s:string)=>s.trim()).filter(Boolean) : [],
      };

      // salary handling: structured or text
      if (form.salaryMode === "structured") {
        payload.salary = {
          min: form.salary.min ? Number(form.salary.min) : undefined,
          max: form.salary.max ? Number(form.salary.max) : undefined,
          currency: form.salary.currency || "INR"
        };
      } else {
        payload.salary = form.salaryText || undefined;
      }

      const res = await fetch(`${API_BASE}/job/post-job`, {
        method: editingJob ? "PUT" : "POST", // if you later implement update, PUT will be used
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      console.log("res", res);
      const data = await res.json();
      console.log("data", data);
      if (res.status === 201 || res.ok) {
        const created = data.job || data;
        // normalize id
        const normalized: Job = {
          ...created,
          id: created._id || created.id || String(created._id)
        };
        // update UI
        setJobs((prev) => [normalized, ...prev.filter(j => (j._id || j.id) !== normalized._id && (j._id || j.id) !== normalized.id)]);
        closePostModal();
      } else if (res.status === 401 || res.status === 403) {
        setErrorMsg(data.error || data.message || "Unauthorized to post job.");
      } else {
        setErrorMsg(data.error || data.message || "Failed to post job.");
      }
    } catch (err) {
      console.error("saveJob error", err);
      setErrorMsg("Server error while posting job.");
    } finally {
      setSaving(false);
    }
  }

  // other UI helpers (same as before)
  function openJob(job: Job) {
    setSelectedJob(job);
  }

  // minimal create calendar link
  function createGoogleCalendarLink(applicantName?: string) {
    const title = encodeURIComponent(`Interview with ${applicantName || "Candidate"}`);
    const details = encodeURIComponent(`Interview scheduled via HR Dashboard\nCandidate: ${applicantName || "-"}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&sf=true&output=xml`;
  }

  // small UI for status banner
  const StatusCard: React.FC<{ status: HRStatus }> = ({ status }) => {
    if (!status) return null;
    if (status === "approved") {
      return (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 text-green-800 rounded-lg px-4 py-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold">Account Approved</div>
            <div className="text-xs text-green-700">You can post jobs and view applicants.</div>
          </div>
        </div>
      );
    }
    if (status === "pending") {
      return (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 text-amber-900 rounded-lg px-4 py-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2M12 4a8 8 0 100 16 8 8 0 000-16z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold">Account Pending</div>
            <div className="text-xs text-amber-800">Your account is awaiting admin approval. You'll be notified when approved.</div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 rounded-lg px-4 py-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold">Account Rejected</div>
          <div className="text-xs text-red-700">Your registration was rejected. Please contact support.</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="w-full md:w-auto">
            <h1 className="text-2xl font-bold text-[#03257e]">HR Dashboard</h1>
            <p className="text-sm text-gray-500">Post jobs, review applicants, analyze resumes and schedule interviews.</p>

            <div className="mt-4">
              {hrLoading ? (
                <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-gray-100 text-gray-700">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" fill="none" /></svg>
                  <span className="text-sm">Checking account status…</span>
                </div>
              ) : (
                hrStatus && <StatusCard status={hrStatus} />
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => openPostModal()}
              className="px-4 py-2 rounded-lg bg-[#03257e] text-white shadow"
              disabled={hrStatus !== "approved"}
              title={hrStatus !== "approved" ? (hrStatus === "pending" ? "Waiting for admin approval" : "Account not approved") : "Post a job"}
            >
              Post Job
            </button>
            <button onClick={() => { /* refresh jobs */ window.location.reload(); }} className="px-4 py-2 rounded-lg border border-[#03257e] text-[#03257e]">
              Refresh
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold text-[#03257e] mb-3">Open Roles</h2>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={(job._id || job.id)} className="p-3 rounded-lg border hover:shadow-sm flex items-center justify-between">
                  <div className="cursor-pointer" onClick={() => openJob(job)}>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-xs text-gray-500">{job.role} • {job.location}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-500">{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-2 space-y-6">
            {!selectedJob ? (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="text-gray-600">Select a job to view applicants and analytics.</div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#03257e]">{selectedJob.title}</h3>
                    <div className="text-sm text-gray-500">{selectedJob.role} • {selectedJob.location}</div>
                    <div className="mt-3 text-sm text-gray-700">{selectedJob.description}</div>
                  </div>
                  <div>
                    <button onClick={() => setSelectedJob(null)} className="px-3 py-2 rounded-lg border">Close</button>
                  </div>
                </div>

                {/* applicants list placeholder */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">Applicants</h4>
                  <div className="text-sm text-gray-500">Applicant list loading / not implemented in demo.</div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* POST / EDIT MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closePostModal}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingJob ? "Edit Job" : "Post New Job"}</h3>
              <button onClick={closePostModal} className="px-2 py-1 rounded border">Close</button>
            </div>

            <form onSubmit={saveJob} className="space-y-3">
              <input
                value={form.title}
                onChange={(e)=>setForm((s:any)=>({...s,title:e.target.value}))}
                required className="w-full border rounded-lg px-3 py-2" placeholder="Job title" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={form.company} onChange={(e)=>setForm((s:any)=>({...s,company:e.target.value}))} className="w-full border rounded-lg px-3 py-2" placeholder="Company (auto-filled)" />
                <input value={form.location} onChange={(e)=>setForm((s:any)=>({...s,location:e.target.value}))} className="w-full border rounded-lg px-3 py-2" placeholder="Location" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={form.role} onChange={(e)=>setForm((s:any)=>({...s,role:e.target.value}))} className="w-full border rounded-lg px-3 py-2" placeholder="Role / Department" />
                <select value={form.employmentType} onChange={(e)=>setForm((s:any)=>({...s,employmentType:e.target.value}))} className="w-full border rounded-lg px-3 py-2">
                  <option value="full-time">Full time</option>
                  <option value="part-time">Part time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isRemote} onChange={(e)=>setForm((s:any)=>({...s,isRemote:e.target.checked}))} />
                  <span className="text-sm">Remote</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Salary mode:</label>
                  <select value={form.salaryMode} onChange={(e)=>setForm((s:any)=>({...s,salaryMode:e.target.value}))} className="border rounded px-2 py-1 text-sm">
                    <option value="structured">Structured (min/max)</option>
                    <option value="text">Free text</option>
                  </select>
                </div>
              </div>

              {form.salaryMode === "structured" ? (
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={form.salary.min || ""} onChange={(e)=>setForm((s:any)=>({...s,salary:{...s.salary,min:e.target.value}}))} placeholder="Min" className="border rounded px-3 py-2" />
                  <input type="number" value={form.salary.max || ""} onChange={(e)=>setForm((s:any)=>({...s,salary:{...s.salary,max:e.target.value}}))} placeholder="Max" className="border rounded px-3 py-2" />
                  <input value={form.salary.currency || "INR"} onChange={(e)=>setForm((s:any)=>({...s,salary:{...s.salary,currency:e.target.value}}))} placeholder="Currency" className="border rounded px-3 py-2" />
                </div>
              ) : (
                <input value={form.salaryText} onChange={(e)=>setForm((s:any)=>({...s,salaryText:e.target.value}))} placeholder="e.g. Competitive / Up to 10 LPA" className="w-full border rounded px-3 py-2" />
              )}

              <textarea value={form.description} onChange={(e)=>setForm((s:any)=>({...s,description:e.target.value}))} required className="w-full border rounded-lg px-3 py-2 h-36" placeholder="Job description" />

              <input value={form.applyUrl} onChange={(e)=>setForm((s:any)=>({...s,applyUrl:e.target.value}))} className="w-full border rounded-lg px-3 py-2" placeholder="Apply URLs (comma separated)" />
              <input value={form.tags} onChange={(e)=>setForm((s:any)=>({...s,tags:e.target.value}))} className="w-full border rounded-lg px-3 py-2" placeholder="Tags (comma separated)" />

              {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closePostModal} className="px-3 py-2 rounded-lg border">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[#03257e] text-white">
                  {saving ? "Posting..." : (editingJob ? "Save Changes" : "Post Job")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

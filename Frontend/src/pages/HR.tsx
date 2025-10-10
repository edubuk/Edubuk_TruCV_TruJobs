// HRDashboardWithBackend.tsx
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "@/main";
import { Link } from "react-router-dom";
import {AlertTriangle} from "lucide-react"
import toast from "react-hot-toast";
import console from "console";

type Job = {
  _id?: string; // backend uses _id
  id?: string;
  title: string;
  company: string;
  job_description_id?: string;
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

type HRStatus = "approved" | "pending" | "rejected" | null;

/** ---------- Similarity API Types ---------- */
type VectorScores = {
  skills: number;
  experience: number;
  certifications: number;
  projects: number;
};

type MatchMeta = {
  summary: string | null;
  skills: string;
  skills_list: string[];
  full_name: string | null;
  projects_text: string;
  phone: string | null;
  education_text: string;
  location: string | null;
  work_experience_text: string;
  certifications: string;
  raw_text_preview: string;
  email: string | null;
};

type Match = {
  nano_Id:string;
  resume_id: string;
  candidate_name: string;
  similarity_score: number; // 0..1 (can be small in your sample)
  vector_scores: VectorScores;
  match_explanation: string;
  metadata: MatchMeta;
};

type SimilarityResponse = {
  job_description: { id: string; title: string };
  matches: Match[];
  total_matches: number;
  execution_time: string;
  debug_info: {
    total_resumes_found: number;
    matches_after_threshold: number;
    matches_returned: number;
    job_embedding_dimension: number;
    similarity_threshold: number;
    top_k_applied: number;
    job_title: string;
  };
};
/** ----------------------------------------- */

const API_BASE = API_BASE_URL || "http://localhost:8000";

export default function HRDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  /** Similarity state */
  const [similarity, setSimilarity] = useState<SimilarityResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);


  /** Analysis side panel */
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisCandidate, setAnalysisCandidate] = useState<Match | null>(null);

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

  function displaySalary(s: any) {
    if (!s) return "-";
    if (typeof s === "string") return s;
    const min = s.min, max = s.max, cur = s.currency || "INR";
    if (min !== undefined && max !== undefined) return `${min/1000}K-${max/1000}K ${cur}`;
    if (min !== undefined) return `From ${min/1000}K ${cur}`;
    if (max !== undefined) return `Up to ${max/1000}K ${cur}`;
    return "-";
  }

  // HR and status
  const [hrStatus, setHrStatus] = useState<HRStatus>(null);
  const [hr, setHr] = useState<any>(null);
  const [hrLoading, setHrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

      // load existing jobs (public)
      const fetchJobs = async (hrId: string) => {
        try {
          const res = await fetch(`${API_BASE}/job/hr-jobs?hrId=${hrId}`);
          if (res.ok) {
            const data = await res.json();
            const list = data.jobs || data;
            setJobs(Array.isArray(list) ? list : []);
          }
        } catch (err) {
          console.error("fetchJobs error", err);
        }
      };

  useEffect(() => {
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
          const hrData = data.hr || data;
          setHr(hrData);
          setHrStatus(hrData.status);
          fetchJobs(hrData.id);
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

  const deleteJob = async (jobId: string) => {
    try {
      setJobId(jobId);
      const token = localStorage.getItem("googleIdToken");
      if (!token) return;
      const res = await fetch(`${API_BASE}/hr/deleteJob/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (res.ok) {
        fetchJobs(hr?.id || "");
        toast.success("Job deleted");
      }
    } catch (err) {
      console.error("deleteJob error", err);
      toast.error("Failed to delete job");
    }
    setJobId(null);
  };

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

  //upload jd to s3 bucket
  const uploadJD = async (jd: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/file/uploadJD`,{
        method:"POST",
        body: JSON.stringify({ job_description: jd }),
        headers:{ "Content-Type": "application/json" },
      });
      const data = await res.json();
      return data.job_description_id;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const getSimilarityScore = async (job_description_id:string, top_k=5) => {
    try {
      setSimLoading(true);
      setSimError(null);
      const res = await fetch(`${API_BASE_URL}/hr/getSimilarityScore?job_description_id=${job_description_id}&top_k=${top_k}`,{
        method:"GET",
        headers:{ "Content-Type": "application/json" },
      });
      const data = await res.json();
      setSimilarity(data.data as SimilarityResponse);
      console.log("similarity data",data.data)
    } catch (error) {
      console.error(error);
      setSimError("Failed to load matching candidates.");
      setSimilarity(null);
      return null;
    } finally {
      setSimLoading(false);
    }
  };

  // Save (create) job -> POST /jobs
  async function saveJob(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (hrStatus !== "approved") {
      setErrorMsg("Only approved HR accounts can post jobs.");
      return;
    }
    if (!form.title || !form.company || !form.description) {
      setErrorMsg("Please fill title, company and description.");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("googleIdToken");
    const job_description = `Edubuk is hiring ${form.title} at ${form.company} located in ${form.location}. Role: ${form.role}. Description: ${form.description}. Posted at: ${new Date().toISOString()}. Employment Type: ${form.employmentType}. Remote: ${form.isRemote}. Salary: ${form.salaryText}. Tags: ${form.tags}. Posted By: ${hr.name} (ID: ${hr.id}).`;

    try {
      const payload: any = {
        title: form.title,
        company: form.company,
        location: form.location,
        role: form.role,
        employmentType: form.employmentType,
        isRemote: !!form.isRemote,
        salary: form.salaryText,
        description: form.description,
        applyUrl: form.applyUrl ? form.applyUrl.split(",").map((s:string)=>s.trim()).filter(Boolean) : [],
        tags: form.tags ? form.tags.split(",").map((s:string)=>s.trim()).filter(Boolean) : [],
      };

      const job_description_id = await uploadJD(job_description);
      if (!job_description_id) {
        setErrorMsg("Failed to upload job description.");
        return;
      }
      payload.job_description_id = job_description_id;

      const res = await fetch(`${API_BASE}/job/post-job`, {
        method: editingJob ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.status === 201 || res.ok) {
        const created = data.job || data;
        const normalized: Job = { ...created, id: created._id || created.id || String(created._id) };
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

  /** ---------- UI helpers for similarity ---------- */
  const pct = (n: number | undefined) => (typeof n === "number" ? Math.round(n * 100) : 0);

  const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    const width = Math.max(0, Math.min(100, Math.round((value + 1) * 50))); // handles small/negative values gracefully
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{label}</span>
          <span>{value.toFixed(2)}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-2 rounded-full bg-[#006666]" style={{ width: `${width}%` }} />
        </div>
      </div>
    );
  };

  const SimilarityHeader: React.FC<{ s: SimilarityResponse }> = ({ s }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="text-sm text-gray-600">
        <span className="font-medium">Embedding dim:</span> {s?.debug_info.job_embedding_dimension} •{" "}
        <span className="font-medium">Top-K:</span> {s?.debug_info.top_k_applied} •{" "}
        <span className="font-medium">Threshold:</span> {s?.debug_info.similarity_threshold} •{" "}
        <span className="font-medium">Execution:</span> {s?.execution_time}
      </div>
      <div className="text-xs text-gray-500">
        Resumes found: {s?.debug_info.total_resumes_found} • After threshold: {s?.debug_info.matches_after_threshold} • Returned: {s?.debug_info.matches_returned}
      </div>
    </div>
  );

  /** Open a job + load similarity */
  async function openJob(job: Job) {
    setSelectedJob(job);
    setSimilarity(null);
    if (job?.job_description_id) {
      await getSimilarityScore(job.job_description_id, 5);
    }
  }

  function closeAnalysis() {
    setAnalysisOpen(false);
    setAnalysisCandidate(null);
  }

  // minimal create calendar link
  function createGoogleCalendarLink(applicantName?: string) {
    const title = encodeURIComponent(`Interview with ${applicantName || "Candidate"}`);
    const details = encodeURIComponent(`Interview scheduled via HR Dashboard\nCandidate: ${applicantName || "-"}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&sf=true&output=xml`;
  }

  // small UI for status banner
  const StatusCard: React.FC<{ status: HRStatus }> = ({ status }) => {
    if (!status) return(
      <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-800 rounded-lg px-4 py-3">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold">Account Rejected</div>
          <div className="text-xs text-red-700">Your account has been rejected. Please contact support for assistance.</div>
        </div>
      </div>
    );
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
            <h1 className="text-2xl font-bold text-[#03257e]">HR Dashboard <span className="text-[#f14419]">|</span> <span className="text-[#006666]"> {hr?.companyName}</span></h1>
            <p className="text-sm text-gray-500">Address: {hr?.address}</p>
            <p className="text-sm text-gray-500">Post jobs, review applicants, analyze resumes and schedule interviews.</p>

            <div className="mt-4">
              {hrLoading ? (
                <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-gray-100 text-gray-700">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" fill="none" /></svg>
                  <span className="text-sm">Checking account status…</span>
                </div>
              ) : (
                hrStatus?<StatusCard status={hrStatus} />:
                <div className="relative flex justify-center items-center gap-4 rounded-2xl border border-red-200 bg-red-50/90 p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                {/* Icon */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
          
                {/* Text + Button */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold text-red-800">
                    Your Company is not registered
                  </h3>
                  <p className="text-sm text-red-700">
                    Please register your company to post jobs. <br />
                    To register, login as <span className="font-medium">HR</span> and
                    register your company.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block w-fit rounded-lg bg-[#03257e] px-5 py-2 text-sm font-medium text-white shadow-md transition hover:bg-[#021b5c] hover:shadow-lg"
                  >
                    Login as HR
                  </Link>
                </div>
          
                {/* Optional decorative gradient corner */}
                <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-br from-red-200/40 to-transparent rounded-tr-2xl" />
              </div>
              )}
            </div>
          </div>

          {hrStatus==="approved"&&<div className="flex gap-2">
            <button
              onClick={() => openPostModal()}
              className="px-4 py-2 rounded-lg bg-[#03257e] text-white shadow"
              disabled={hrStatus !== "approved"}
              title={hrStatus !== "approved" ? (hrStatus === "pending" ? "Waiting for admin approval" : "Account not approved") : "Post a job"}
            >
              Post Job
            </button>
            <button onClick={() => { window.location.reload(); }} className="px-4 py-2 rounded-lg border border-[#03257e] text-[#03257e]">
              Refresh
            </button>
          </div>}
        </header>

        {hrStatus==="approved"&&<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Open roles */}
          <aside className="lg:col-span-1 bg-white rounded-2xl shadow p-4">
            <h2 className="text-lg font-semibold text-[#03257e] mb-3">Open Roles</h2>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={(job._id || job.id)} className={`p-3 rounded-lg border hover:shadow-sm flex items-center justify-between ${selectedJob && (selectedJob._id||selectedJob.id)===(job._id||job.id) ? "border-[#03257e]" : ""}`}>
                  <div className="cursor-pointer" onClick={() => openJob(job)}>
                    <div className="font-medium">{job.title}</div>
                    <div className="text-xs text-gray-500">{job.role} • {job.location}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                  {!jobId?<button onClick={() => deleteJob(job?._id || "")} className="bg-[#f14419] text-white px-2 rounded">Delete</button>:<p className="text-sm text-center text-[#f14419]">{jobId===job._id||job.id&&'Deleting...'}</p>}
                    <div className="text-sm text-gray-500">{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right: Selected role + applicants + analysis */}
          <main className="lg:col-span-2 space-y-6">
            {!selectedJob ? (
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="text-gray-600">Select a job to view applicants and analytics.</div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow p-6">
                {/* Job header */}
                <article key={selectedJob.id || selectedJob._id} className="bg-white rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-lg text-[#03257e]">{selectedJob.title}</div>
                      <div className="text-sm text-gray-500">{selectedJob.company} • {selectedJob.location} {selectedJob.isRemote ? "• Remote" : ""}</div>
                      <div className="mt-2 text-xs">
                        {selectedJob.tags?.slice(0,4).map(t=> <span key={t} className="inline-block mr-2 px-2 py-1 bg-gray-100 rounded text-xs">{t}</span>)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{selectedJob.employmentType}</div>
                      <div className="text-xl font-bold text-[#006666]">{displaySalary(selectedJob.salary) || "-"}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-700">{selectedJob.description}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">Posted: {selectedJob.postedAt ? new Date(selectedJob.postedAt).toLocaleDateString() : "-"}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAnalysisOpen(true)}
                        className="px-4 py-2 rounded-lg border text-sm"
                        disabled={!similarity || simLoading}
                        title={!similarity ? "Load candidates first" : "Analyze JD vs candidates"}
                      >
                        Analyze
                      </button>
                    </div>
                  </div>
                </article>

                {/* Applicants */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Applicants (Similarity)</h4>
                    {simLoading && (
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" fill="none" /></svg>
                        Loading…
                      </div>
                    )}
                  </div>

                  {simError && <div className="text-sm text-red-600">{simError}</div>}

                  {similarity && (
                    <>
                      <SimilarityHeader s={similarity} />

                      <ul className="space-y-3 overflow-y-scroll no-scrollbar h-[400px]">
                        {similarity?.matches && similarity?.matches.map((m) => (
                          <li key={m?.resume_id} className="border rounded-lg p-3 hover:shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium text-[#03257e]">{m?.candidate_name}</div>
                                <div className="text-xs text-gray-500">{m?.metadata?.email || "-"}</div>
                                <div className="mt-2 text-xs text-gray-600">
                                  <span className="font-semibold">Overall:</span> {pct(m?.similarity_score)}%
                                  <span className="ml-2 text-gray-400">({m?.match_explanation})</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                              <a
                                  href={`https://edubuk-hackathon.vercel.app/cv/${m.nano_Id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 text-white py-1 text-xs rounded-lg border bg-[#006666]"
                                >
                                  TruCV
                                </a>
                                <a
                                  href={createGoogleCalendarLink(m.candidate_name)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1 text-xs rounded-lg border"
                                >
                                  Schedule
                                </a>
                                <button
                                  onClick={() => { setAnalysisCandidate(m); setAnalysisOpen(true); }}
                                  className="px-3 py-1 text-xs rounded-lg bg-[#03257e] text-white"
                                >
                                  Analyze
                                </button>
                              </div>
                            </div>

                            {/* compact vector bars */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                              <ScoreBar label="Skills" value={m.vector_scores.skills} />
                              <ScoreBar label="Experience" value={m.vector_scores.experience} />
                              <ScoreBar label="Certifications" value={m.vector_scores.certifications} />
                              <ScoreBar label="Projects" value={m.vector_scores.projects} />
                            </div>

                            {/* quick chips */}
                            {m.metadata.skills_list?.length > 0 && (
                              <div className="mt-2">
                                {m.metadata.skills_list.slice(0,8).map(s => (
                                  <span key={s} className="inline-block mr-2 mt-1 px-2 py-0.5 bg-gray-100 rounded text-[11px]">{s}</span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {!similarity && !simLoading && (
                    <div className="text-sm text-gray-500">Open a role to load matched candidates.</div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>}
      </div>

      {/* POST / EDIT MODAL (unchanged except binding to saveJob) */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closePostModal}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingJob ? "Edit Job" : "Post New Job"}</h3>
              <button onClick={closePostModal} className="px-2 py-1 rounded border">Close</button>
            </div>

            <form onSubmit={saveJob} className="space-y-3">
              <input value={form.title} onChange={(e)=>setForm((s:any)=>({...s,title:e.target.value}))} required className="w-full border rounded-lg px-3 py-2" placeholder="Job title" />
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
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isRemote} onChange={(e)=>setForm((s:any)=>({...s,isRemote:e.target.checked}))} />
                <span className="text-sm">Remote</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm">Salary</label>
              </div>
                <input value={form.salaryText} onChange={(e)=>setForm((s:any)=>({...s,salaryText:e.target.value}))} placeholder="e.g. Competitive / Up to 10 LPA" className="w-full border rounded px-3 py-2" />
              <textarea value={form.description} onChange={(e)=>setForm((s:any)=>({...s,description:e.target.value}))} required className="w-full border rounded-lg px-3 py-2 h-36" placeholder="Job description" />
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

      {/* ---------- ANALYSIS SIDE PANEL ---------- */}
      {analysisOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={closeAnalysis} />
          <div className="w-full max-w-xl h-full bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#03257e]">JD vs Candidate Analysis</h3>
              <button onClick={closeAnalysis} className="px-2 py-1 rounded border">Close</button>
            </div>

            {!similarity && <div className="text-sm text-gray-500">No similarity data loaded.</div>}

            {similarity && (
              <>
                {/* JD Summary */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500">Job</div>
                  <div className="font-medium">{selectedJob?.title} • {selectedJob?.company}</div>
                  <div className="text-xs text-gray-600 mt-1">Role: {selectedJob?.role || "-"}</div>
                  <p className="text-sm text-gray-700 mt-2">{selectedJob?.description}</p>
                </div>

                {/* Candidate selector */}
                <div className="mb-4">
                  <label className="text-xs text-gray-500">Candidate</label>
                  <select
                    className="mt-1 w-full border rounded px-2 py-2 text-sm"
                    value={analysisCandidate?.resume_id || ""}
                    onChange={(e) => {
                      const next = similarity.matches.find(m => m.resume_id === e.target.value) || null;
                      setAnalysisCandidate(next);
                    }}
                  >
                    <option value="">Select candidate</option>
                    {similarity.matches.map(m => (
                      <option key={m.resume_id} value={m.resume_id}>
                        {m.candidate_name} • {pct(m.similarity_score)}%
                      </option>
                    ))}
                  </select>
                </div>

                {/* Candidate details */}
                {analysisCandidate ? (
                  <div className="space-y-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{analysisCandidate.candidate_name}</div>
                          <div className="text-xs text-gray-500">{analysisCandidate.metadata.email || "-"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Overall similarity</div>
                          <div className="text-xl font-bold text-[#006666]">{pct(analysisCandidate.similarity_score)}%</div>
                          <div className="text-[11px] text-gray-500">{analysisCandidate.match_explanation}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <ScoreBar label="Skills" value={analysisCandidate.vector_scores.skills} />
                        <ScoreBar label="Experience" value={analysisCandidate.vector_scores.experience} />
                        <ScoreBar label="Certifications" value={analysisCandidate.vector_scores.certifications} />
                        <ScoreBar label="Projects" value={analysisCandidate.vector_scores.projects} />
                      </div>
                    </div>

                    {/* Metadata & text comparisons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2">Candidate Summary</div>
                        <p className="text-sm whitespace-pre-wrap">{analysisCandidate.metadata.summary || "—"}</p>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2">JD Focus Areas</div>
                        <p className="text-sm text-gray-700">
                          {selectedJob?.tags?.length ? selectedJob.tags.join(", ") : "—"}
                        </p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2">Skills (Candidate)</div>
                        {analysisCandidate.metadata.skills_list?.length ? (
                          <div className="text-sm">
                            {analysisCandidate.metadata.skills_list.map(s => (
                              <span key={s} className="inline-block mr-2 mt-1 px-2 py-0.5 bg-gray-100 rounded text-[11px]">{s}</span>
                            ))}
                          </div>
                        ) : <div className="text-sm text-gray-500">—</div>}
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2">Certifications (Candidate)</div>
                        <p className="text-sm whitespace-pre-wrap">{analysisCandidate.metadata.certifications || "—"}</p>
                      </div>

                      <div className="border rounded-lg p-3 sm:col-span-2">
                        <div className="text-xs text-gray-500 mb-2">Projects (Candidate)</div>
                        <p className="text-sm whitespace-pre-wrap">{analysisCandidate.metadata.projects_text || "—"}</p>
                      </div>

                      <div className="border rounded-lg p-3 sm:col-span-2">
                        <div className="text-xs text-gray-500 mb-2">Work Experience (Candidate)</div>
                        <p className="text-sm whitespace-pre-wrap">{analysisCandidate.metadata.work_experience_text || "—"}</p>
                      </div>

                      <div className="border rounded-lg p-3 sm:col-span-2">
                        <div className="text-xs text-gray-500 mb-2">Raw Text Preview</div>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">{analysisCandidate.metadata.raw_text_preview || "—"}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Pick a candidate to analyze.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

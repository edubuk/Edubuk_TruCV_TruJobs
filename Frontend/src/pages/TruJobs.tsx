// TruJobsPortal.tsx
import { useEffect, useMemo, useState } from "react";
import { useUserData } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { Cv_resoponse_type } from "@/types";
import { API_BASE_URL } from "@/main";
import toast from "react-hot-toast";


type Job = {
  id: string;
  _id?: string;
  title: string;
  company: string;
  job_description_id?: string;
  location?: string;
  role?: string;
  employmentType?: string;
  isRemote?: boolean;
  salary?: { min?: number; max?: number; currency?: string } | string;
  description?: string;
  applyUrl?: string;
  status?: string;
  tags?: string[];
  applicationCount?: number;
  postedAt?: string;
};

const API_BASE = API_BASE_URL || "http://localhost:8000";

function TruJobsPortal() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [minPackage, setMinPackage] = useState<number | "">("");
  const [maxPackage, setMaxPackage] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "package_desc" | "package_asc">("newest");
  const [appliedJob, setAppliedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const {nanoId} = useUserData();
  const [applyJsonData, setApplyJsonData] = useState(
    {
      "resume_json": {
        "nano_Id":"",
        "name": "",
        "contact":{"email": "","phone": "","location":"","profession":"","yearOfExperience":""},
        "education":null,
        "experience": null,
        "achievements": null,
        "skills": null
      },
      "job_description_id":""
    }
  );

  // fetch server jobs on mount and when filters change
  useEffect(() => {
    fetchServerJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper to call the /allJobs endpoint with optional server-side params
  const fetchServerJobs = async (overrides?: Record<string, any>) => {
    setLoading(true);
    try {
      const qParams: any = {
        page: 1,
        limit: 100,
        sort: sortBy === "newest" ? "postedAt:desc" : sortBy === "package_desc" ? "salary:desc" : sortBy === "package_asc" ? "salary:asc" : "postedAt:desc",
        q: search || undefined,
        company: companyFilter || undefined,
        role: roleFilter || undefined,
        minSalary: minPackage !== "" ? minPackage : undefined,
        maxSalary: maxPackage !== "" ? maxPackage : undefined,
        ...overrides
      };

      const query = Object.entries(qParams)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");

      const res = await fetch(`${API_BASE}/job/all-jobs?${query}`);
      if (!res.ok) {
        console.error("Failed to fetch jobs", await res.text());
        setLoading(false);
        return;
      }
      const data = await res.json();
      const list: Job[] = data.jobs?.map((j: any) => ({
        ...j,
        id: j._id || j.id || String(j._id)
      })) || [];
      setJobs(list);
    } catch (err) {
      console.error("fetchServerJobs error", err);
    } finally {
      setLoading(false);
    }
  };

  // client-side derived lists (companies, roles) from server data
  const companies = useMemo(() => Array.from(new Set(jobs.map((j) => j.company || "").filter(Boolean))), [jobs]);
  const roles = useMemo(() => Array.from(new Set(jobs.map((j) => j.role || "").filter(Boolean))), [jobs]);

  // client-side filtering (keeps your original UX); you can opt to rely fully on server
  const filtered = useMemo(() => {
    let out = jobs.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((j) => `${j.title} ${j.company} ${j.description}`.toLowerCase().includes(q));
    }
    if (companyFilter) out = out.filter((j) => j.company === companyFilter);
    if (roleFilter) out = out.filter((j) => j.role === roleFilter);
    if (minPackage !== "") out = out.filter((j) => {
      const s = j.salary as any;
      const val = typeof s === "string" ? undefined : (s?.min ?? ((s?.max ?? 0) + (s?.min ?? 0)) / 2);
      return (val ?? 0) >= Number(minPackage);
    });
    if (maxPackage !== "") out = out.filter((j) => {
      const s = j.salary as any;
      const val = typeof s === "string" ? undefined : (s?.max ?? ((s?.max ?? 0) + (s?.min ?? 0)) / 2);
      return (val ?? 0) <= Number(maxPackage);
    });

    if (sortBy === "newest") out.sort((a, b) => +new Date(b.postedAt || 0) - +new Date(a.postedAt || 0));
    if (sortBy === "package_desc") out.sort((a, b) => {
      const avga = computeSalaryAvg(a.salary);
      const avgb = computeSalaryAvg(b.salary);
      return (avgb ?? 0) - (avga ?? 0);
    });
    if (sortBy === "package_asc") out.sort((a, b) => {
      const avga = computeSalaryAvg(a.salary);
      const avgb = computeSalaryAvg(b.salary);
      return (avga ?? 0) - (avgb ?? 0);
    });

    return out;
  }, [jobs, search, companyFilter, roleFilter, minPackage, maxPackage, sortBy]);

  function openApply(job: Job) {
    setAppliedJob(job);
    setShowApplyModal(true);
  }

  function closeApply() {
    setShowApplyModal(false);
    setAppliedJob(null);
  }

  // salary formatting helpers
  function computeSalaryAvg(s: any): number | undefined {
    if (!s) return undefined;
    if (typeof s === "string") return undefined;
    const min = s.min ?? undefined;
    const max = s.max ?? undefined;
    if (min !== undefined && max !== undefined) return (min + max) / 2;
    if (max !== undefined) return max;
    if (min !== undefined) return min;
    return undefined;
  }

  function displaySalary(s: any) {
    if (!s) return "-";
    if (typeof s === "string") return s;
    const min = s.min, max = s.max, cur = s.currency || "INR";
    if (min !== undefined && max !== undefined) return `${min/1000}K-${max/1000}K ${cur}`;
    if (min !== undefined) return `From ${min/1000}K ${cur}`;
    if (max !== undefined) return `Up to ${max/1000}K ${cur}`;
    return "-";
  }



 const getCvRequest = async (selectedNanoId:string): Promise<Cv_resoponse_type> => {
     const response = await fetch(`${API_BASE_URL}/cv/getCvByNanoId/${selectedNanoId}`);
     if (!response.ok) {
       throw new Error("Could not get cv!");
     }
    const data= await response.json();
    console.log("cv data",data)
    setApplyJsonData({
      "resume_json": {
        "nano_Id":data.nanoId,
        "name": data.personalDetails.name,
        "contact": {"email": data.personalDetails.email,"phone": data.personalDetails.phone,"location": data.personalDetails.location,"profession": data.personalDetails.profession,"yearOfExperience": data.personalDetails.years_of_experience},
        "education":data.education,
        "experience": data.experience,
        "achievements": data.achievements,
        "skills": data.skills
      },
      "job_description_id":""
    })
    console.log("apply json data",applyJsonData)
    return data;
     
   };


  const applyJobHandler = async (job_description_id:string) => {
    setLoading(true);
    try {
    const response = await fetch(`${API_BASE_URL}/job/apply-job`, {
      method: "POST",
      body: JSON.stringify({
        "resume_json": applyJsonData.resume_json,
        "job_description_id": job_description_id
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("googleIdToken")}`,
      },
    });
    const data = await response.json();
    console.log("apply job data",data)
    if(data.success){
      toast.success("Job applied successfully!");
      closeApply();
    }
    if (!data.success) {
      console.log("apply job error",data.error)
      toast.error(data.error);
    }
    setLoading(false);
    } catch (error:any) {
      console.log("apply job error",error)
      toast.error(error?.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#03257e]">TruJobs Portal</h1>
            <p className="text-sm text-gray-500">Explore jobs posted by top companies. Use filters to find roles by company, package, role and more.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => fetchServerJobs()} className="px-4 py-2 rounded-lg border border-[#03257e] text-[#03257e]">Refresh</button>
            <button onClick={() => { setJobs([]); fetchServerJobs(); }} className="px-4 py-2 rounded-lg bg-[#03257e] text-white">Load Jobs</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <aside className="lg:col-span-1 bg-white rounded-2xl shadow p-4 sticky top-6">
            <h3 className="text-sm font-semibold text-[#03257e] mb-3">Filters</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Search</label>
                <input value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2" placeholder="Job title, company, keyword" />
              </div>

              <div>
                <label className="text-xs text-gray-600">Company</label>
                <select value={companyFilter} onChange={(e)=>setCompanyFilter(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2">
                  <option value="">All companies</option>
                  {companies.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600">Role</label>
                <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)} className="w-full mt-1 border rounded-lg px-3 py-2">
                  <option value="">All roles</option>
                  {roles.map(r=> <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Min (LPA)</label>
                  <input type="number" value={minPackage as any} onChange={(e)=>setMinPackage(e.target.value?Number(e.target.value):"")} className="w-full mt-1 border rounded-lg px-3 py-2" placeholder="Min" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Max (LPA)</label>
                  <input type="number" value={maxPackage as any} onChange={(e)=>setMaxPackage(e.target.value?Number(e.target.value):"")} className="w-full mt-1 border rounded-lg px-3 py-2" placeholder="Max" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600">Sort</label>
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="w-full mt-1 border rounded-lg px-3 py-2">
                  <option value="newest">Newest</option>
                  <option value="package_desc">Package: High → Low</option>
                  <option value="package_asc">Package: Low → High</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2">
                <button onClick={()=>{setSearch("");setCompanyFilter("");setRoleFilter("");setMinPackage("");setMaxPackage("");setSortBy("newest");fetchServerJobs();}} className="px-3 py-2 rounded-lg border">Clear</button>
                <button onClick={()=>fetchServerJobs()} className="px-3 py-2 rounded-lg bg-[#03257e] text-white">Apply</button>
              </div>
            </div>
          </aside>

          {/* Job list */}
          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">{filtered.length} jobs found</div>
              <div className="text-sm text-gray-500">{loading ? "Loading…" : "Showing results"}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(job=> (
                <article key={job.id || job._id} className="bg-white rounded-2xl shadow p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-lg text-[#03257e]">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.company} • {job.location} {job.isRemote ? "• Remote" : ""}</div>
                        <div className="mt-2 text-xs">
                          {job.tags?.slice(0,4).map(t=> <span key={t} className="inline-block mr-2 px-2 py-1 bg-gray-100 rounded text-xs">{t}</span>)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{job.employmentType}</div>
                        <div className="text-xl font-bold text-[#006666]">{displaySalary(job.salary) || "-"}</div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-700 line-clamp-3">{job.description}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">Posted: {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "-"}</div>
                    <div className="flex gap-2">
                      <a href={job.applyUrl || "#"} onClick={(e)=>{e.preventDefault(); openApply(job);}} className="px-4 py-2 rounded-lg bg-[#f14491] text-white text-sm">Apply</a>
                    </div>
                  </div>
                </article>
              ))}

              {filtered.length===0 && !loading && (
                <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6 text-center text-gray-500">No jobs availables or  no jobs match your filters. Try clearing filters.</div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* APPLY MODAL */}
      {showApplyModal && appliedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeApply}></div>
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Apply — {appliedJob.title} @ {appliedJob.company}</h3>
              <button onClick={closeApply} className="px-2 py-1 rounded border">Close</button>
            </div>
            <div>
              <p className="text-sm font-sans"><span className="font-semibold">Description:</span> {appliedJob?.description}</p>
              <p className="text-sm font-sans"><span className="font-semibold">Location:</span> {appliedJob?.location}</p>
              <p className="text-sm font-sans"><span className="font-semibold">Employment Type:</span> {appliedJob?.employmentType}</p>
              <p className="text-sm font-sans"><span className="font-semibold">Required Skills:</span> {appliedJob?.tags?.join(", ")}</p>
            </div>
            {nanoId?.length>0?<div className="mt-4 flex flex-col gap-4">
              <p className="text-md text-[#03257e]">You have <span className="font-semibold text-[#006666]">{nanoId?.length}</span> resume created. Please select one to apply.</p>
              <select className="w-full border rounded-lg px-3 py-2 " onChange={(e)=>{getCvRequest(e.target.value)}}>
                <option value="">Select a resume</option>
                {nanoId.map(id=> <option key={id} value={id}>Resume {id}</option>)}
              </select>
              {!loading?<button className="mt-4 w-full bg-[#03257e] text-white text-sm font-semibold py-2 px-4 rounded hover:bg-[#006666] transition" onClick={()=>{applyJobHandler(appliedJob?.job_description_id || "")}}>Apply</button>:<p className="mt-4 w-full text-center text-[#006666] text-sm font-semibold py-2 px-4 rounded transition">Applying...</p>}
            </div>:<div className="mt-4 flex justify-center justify-items-center flex-col gap-4">
              <p className="text-sm text-[#f14419]">We didn't find any resume in your account. Please create a resume to apply.</p>
              <Link to="/create-cv" className="mt-4 bg-[#03257e] text-center text-white text-sm font-semibold py-2 px-4 rounded hover:bg-[#006666] transition">Create Resume <ArrowRightIcon className="inline w-4 h-4 ml-2" /></Link>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default TruJobsPortal;


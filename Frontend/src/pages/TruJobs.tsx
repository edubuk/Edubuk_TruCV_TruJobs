import React, { useEffect, useMemo, useState } from "react";

// TruJobsPortal.tsx
// React + TypeScript + Tailwind single-file demo for job seekers
// Colors used: #03257e, #006666, #f14491

type Job = {
  id: string;
  title: string;
  company: string;
  location?: string;
  role?: string;
  packageLPA?: number; // annual package in LPA (lakhs per annum)
  description?: string;
  postedAt: string;
  applyUrl?: string;
};

const DUMMY_JOBS: Job[] = [
  {
    id: "t1",
    title: "Blockchain Developer",
    company: "Edubuk Tech",
    location: "Remote",
    role: "Fulltime",
    packageLPA: 20,
    description: "Work on smart contracts, Algorand SDK and blockchain integrations.",
    postedAt: new Date().toISOString(),
    applyUrl: "#apply_t1",
  },
  {
    id: "t2",
    title: "Frontend Engineer (React)",
    company: "Nova Labs",
    location: "Bengaluru, India",
    role: "Fulltime",
    packageLPA: 12,
    description: "Build beautiful, accessible React apps using TypeScript and Tailwind.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    applyUrl: "#apply_t2",
  },
  {
    id: "t3",
    title: "SRE / DevOps Engineer",
    company: "CloudX",
    location: "Hyderabad, India",
    role: "Contract",
    packageLPA: 18,
    description: "Improve platform reliability, CI/CD and observability.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    applyUrl: "#apply_t3",
  },
  {
    id: "t4",
    title: "Product Designer",
    company: "Edubuk Tech",
    location: "Remote",
    role: "Part-time",
    packageLPA: 6,
    description: "Design delightful product experiences and prototypes.",
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    applyUrl: "#apply_t4",
  },
];

export default function TruJobsPortal() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [minPackage, setMinPackage] = useState<number | "">("");
  const [maxPackage, setMaxPackage] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"relevance" | "newest" | "package_desc" | "package_asc">("newest");
  const [appliedJob, setAppliedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    // simulate API
    setTimeout(() => setJobs(DUMMY_JOBS), 200);
  }, []);

  const companies = useMemo(() => Array.from(new Set(jobs.map((j) => j.company))), [jobs]);
  const roles = useMemo(() => Array.from(new Set(jobs.map((j) => j.role || ""))).filter(Boolean), [jobs]);

  const filtered = useMemo(() => {
    let out = jobs.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((j) => `${j.title} ${j.company} ${j.description}`.toLowerCase().includes(q));
    }
    if (companyFilter) out = out.filter((j) => j.company === companyFilter);
    if (roleFilter) out = out.filter((j) => j.role === roleFilter);
    if (minPackage !== "") out = out.filter((j) => (j.packageLPA ?? 0) >= Number(minPackage));
    if (maxPackage !== "") out = out.filter((j) => (j.packageLPA ?? 0) <= Number(maxPackage));

    if (sortBy === "newest") out.sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
    if (sortBy === "package_desc") out.sort((a, b) => (b.packageLPA ?? 0) - (a.packageLPA ?? 0));
    if (sortBy === "package_asc") out.sort((a, b) => (a.packageLPA ?? 0) - (b.packageLPA ?? 0));

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

  function submitApply(e?: React.FormEvent) {
    e?.preventDefault();
    // for demo just close and show a success toast (alert)
    closeApply();
    alert(`Application submitted for ${appliedJob?.title} at ${appliedJob?.company}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#03257e]">TruJobs Portal</h1>
            <p className="text-sm text-gray-500">Explore jobs posted by top companies. Use filters to find roles by company, package, role and more.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setJobs(DUMMY_JOBS)} className="px-4 py-2 rounded-lg border border-[#03257e] text-[#03257e]">Reset</button>
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
                <button onClick={()=>{setSearch("");setCompanyFilter("");setRoleFilter("");setMinPackage("");setMaxPackage("");setSortBy("newest")}} className="px-3 py-2 rounded-lg border">Clear</button>
                <button onClick={()=>{}} className="px-3 py-2 rounded-lg bg-[#03257e] text-white">Apply</button>
              </div>
            </div>
          </aside>

          {/* Job list */}
          <main className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">{filtered.length} jobs found</div>
              <div className="text-sm text-gray-500">Showing results</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(job=> (
                <div key={job.id} className="bg-white rounded-2xl shadow p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-lg text-[#03257e]">{job.title}</div>
                        <div className="text-sm text-gray-500">{job.company} • {job.location}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{job.role}</div>
                        <div className="text-xl font-bold text-[#006666]">{job.packageLPA ? `${job.packageLPA} LPA` : "-"}</div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-gray-700">{job.description}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">Posted: {new Date(job.postedAt).toLocaleDateString()}</div>
                    <div className="flex gap-2">
                      <a href={job.applyUrl} onClick={(e)=>{e.preventDefault(); openApply(job)}} className="px-4 py-2 rounded-lg bg-[#f14491] text-white text-sm">Apply</a>
                      <a href="#" className="px-4 py-2 rounded-lg border text-sm">Save</a>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length===0 && (
                <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6 text-center text-gray-500">No jobs match your filters. Try clearing filters.</div>
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

            <form onSubmit={submitApply} className="space-y-3">
              <input required placeholder="Your full name" className="w-full border rounded-lg px-3 py-2" />
              <input required placeholder="Email" type="email" className="w-full border rounded-lg px-3 py-2" />
              <input placeholder="Phone" className="w-full border rounded-lg px-3 py-2" />
              <textarea placeholder="Short message / cover note" className="w-full border rounded-lg px-3 py-2 h-24" />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeApply} className="px-3 py-2 rounded-lg border">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#03257e] text-white">Submit Application</button>
              </div>
            </form>

            <div className="mt-3 text-xs text-gray-500">Note: This is a demo form — in production this will POST to the employer's application endpoint or create a candidate profile in TruJobs.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// AdminUsersPage.tsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AccessDeniedPage from "./AccessDenied";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";

type HRItem = {
  id: string;
  name?: string;
  address?: string;
  companyName?: string;
  email?: string;
  mobileNumber?: string;
  documents?: string[];
  status?: "pending" | "approved" | "rejected";
  createdAt?: string;
  rejectionReason?: string;
};

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const AdminUsersPage = () => {
  // user management (existing)
  const [usersData, setUsersData] = useState<any>([]);
  const [checkAccess, setCheckAccess] = useState<boolean>(false);

  // modal / edit state (existing)
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newPlan, setNewPlan] = useState<"Free" | "Pro">("Free");
  const [saving, setSaving] = useState<boolean>(false);

  // NEW: companies (HR) management
  const [companies, setCompanies] = useState<HRItem[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyStatusFilter, setCompanyStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedCompany, setSelectedCompany] = useState<HRItem | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  // tab state: "users" or "companies"
  const [activeTab, setActiveTab] = useState<"users" | "companies">("users");

  // --- existing fetch users
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/getAllUser`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("googleIdToken")}`,
        },
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.message || "Failed to fetch users");
        return;
      }
      setUsersData(data.data);
      setCheckAccess(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // --- New: fetch companies by status
  const fetchCompanies = async (status?: "pending" | "approved" | "rejected") => {
    setCompanyLoading(true);
    try {
      const qs = status || "pending";
      const res = await fetch(`${API_BASE_URL}/hr/companies-list?status=${qs}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("googleIdToken")}`,
          "Content-Type": "application/json",
        },
      });
      const body = await res.json();
      if (!res.ok || !body || body.success === false) {
        toast.error(body?.message || `Failed to load companies (${res.status})`);
        setCompanyLoading(false);
        return;
      }
      console.log({body});
      setCompanies(body.pending || []);
    } catch (err) {
      console.error("fetchCompanies", err);
      toast.error("Failed to load companies");
    } finally {
      setCompanyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "companies") {
      fetchCompanies(companyStatusFilter);
    }
  }, [activeTab, companyStatusFilter]);

  // --- existing modal handlers
  function openEdit(user: any) {
    setEditingUser(user);
    setNewPlan(user.subscriptionPlan === "Pro" ? "Pro" : "Free");
  }
  function closeModal() {
    if (saving) return;
    setEditingUser(null);
  }

  async function handleSubmit() {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/updateSubscriptionPlan`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("googleIdToken")}`,
        },
        body: JSON.stringify({ email: editingUser.email, subscriptionPlan: newPlan }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || (result && result.success === false)) {
        const msg = result?.message || `Server error: ${res.status}`;
        toast.error(`Failed to update: ${msg}`);
        setSaving(false);
        return;
      }

      setUsersData((prev: any[]) =>
        prev.map((u) =>
          u.email === editingUser.email ? { ...u, subscriptionPlan: newPlan } : u
        )
      );

      toast.success("Subscription updated");
      setTimeout(() => {
        setSaving(false);
        closeModal();
      }, 500);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update subscription");
      setSaving(false);
    }
  }

  // --- New: approve/reject company actions
  const approveCompany = async (hrId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/hr/approve/${hrId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("googleIdToken")}`,
          "Content-Type": "application/json",
        },
      });
      const body = await res.json();
      if (!res.ok || body?.success === false) {
        toast.error(body?.message || "Failed to approve");
        return;
      }
      toast.success("Company approved");
      // remove from pending list or update in-place
      setCompanies(prev => prev.filter(c => c.status !== "approved"));
    } catch (err) {
      console.error("approveCompany", err);
      toast.error("Failed to approve company");
    }
  };

  const openRejectModal = (company: HRItem) => {
    setSelectedCompany(company);
    setRejectReason(company.rejectionReason || "");
    setRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!selectedCompany) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/hr/reject/${selectedCompany.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("googleIdToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || body?.success === false) {
        toast.error(body?.message || "Failed to reject");
        return;
      }
      toast.success("Company rejected");
      // remove from list or update
      setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id));
      setRejectModalOpen(false);
      setSelectedCompany(null);
      setRejectReason("");
    } catch (err) {
      console.error("submitReject", err);
      toast.error("Failed to reject company");
    }
  };

  return (
    <>
      {!checkAccess ? (
        <div className="min-h-screen bg-white p-6">
          <h1 className="text-3xl font-bold text-[#03257e] mb-6 text-center">Admin Dashboard</h1>

          {/* Tabs */}
          <div className="flex gap-3 mb-6 justify-center">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-lg ${activeTab === "users" ? "bg-[#03257e] text-white" : "bg-white border" }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("companies")}
              className={`px-4 py-2 rounded-lg ${activeTab === "companies" ? "bg-[#03257e] text-white" : "bg-white border" }`}
            >
              Companies
            </button>
          </div>

          {activeTab === "users" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {usersData.map((user: any) => (
                  <div key={user._id} className="bg-white border rounded-2xl shadow-md p-5 flex flex-col gap-3" style={{ borderColor: "#006666" }}>
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-[#03257e] break-all">{user.email}</h2>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 text-sm rounded-full font-medium bg-[#f14419] text-white">
                          {user.subscriptionPlan}
                        </span>

                        <button
                          aria-label={`Edit subscription for ${user.email}`}
                          title="Edit subscription"
                          onClick={() => openEdit(user)}
                          className="p-2 rounded-full shadow-sm hover:scale-[1.03] transition-transform"
                          style={{ background: "rgba(3,37,126,0.04)" }}
                        >
                          <FaEdit style={{ color: "#03257e" }} />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-[#006666]">Payment ID:</span>{" "}
                      {user.paymentId || "N/A"}
                    </p>

                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-[#006666]">Coupon:</span>{" "}
                      {user.couponCode || "N/A"}
                    </p>

                    <div>
                      <h3 className="font-semibold text-[#03257e] mb-2">CVs:</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.nanoIds && user.nanoIds.length > 0 ? (
                          user.nanoIds.map((id: any, idx: any) => (
                            <a key={idx} href={`/cv/${id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm font-medium rounded-lg shadow-sm transition bg-[#006666] text-white hover:bg-[#03257e]">
                              View CV {idx + 1}
                            </a>
                          ))
                        ) : (
                          <p className="text-gray-500">No CVs uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Companies tab
            <>
              <div className="flex items-center gap-3 justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCompanyStatusFilter("pending")}
                    className={`px-3 py-1 rounded-lg ${companyStatusFilter === "pending" ? "bg-amber-400 text-white" : "bg-white border"}`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setCompanyStatusFilter("approved")}
                    className={`px-3 py-1 rounded-lg ${companyStatusFilter === "approved" ? "bg-green-500 text-white" : "bg-white border"}`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setCompanyStatusFilter("rejected")}
                    className={`px-3 py-1 rounded-lg ${companyStatusFilter === "rejected" ? "bg-red-500 text-white" : "bg-white border"}`}
                  >
                    Rejected
                  </button>
                </div>

                <div>
                  <button onClick={() => fetchCompanies(companyStatusFilter)} className="px-3 py-1 rounded-lg border">Refresh</button>
                </div>
              </div>

              {companyLoading ? (
                <div className="text-center py-12 text-gray-500">Loading companies…</div>
              ) : companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No companies found for <strong>{companyStatusFilter}</strong>.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companies.map((c) => (
                    <div key={c.id} className="bg-white border rounded-2xl shadow-md p-5 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="text-lg font-semibold text-[#03257e]">{c.companyName || "—"}</div>
                          <div className="text-sm text-gray-600">{c.name || "Contact" } • {c.email}</div>
                          <div className="text-sm text-gray-600">Address: <strong>{c.address}</strong></div>
                          <div className="text-xs text-gray-500 mt-2">Registered: {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm px-2 py-1 rounded-full text-white font-medium" style={{ background: c.status === "approved" ? "#10B981" : c.status === "pending" ? "#F59E0B" : "#EF4444" }}>
                            {c.status}
                          </div>

                          {c.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => approveCompany(c?.id)} className="px-3 py-1 rounded-lg bg-[#03257e] text-white">Approve</button>
                              <button onClick={() => openRejectModal(c)} className="px-3 py-1 rounded-lg border text-[#ef4444]">Reject</button>
                            </div>
                          )}

                          {c.status === "rejected" && c.rejectionReason && (
                            <div className="text-xs text-red-600 mt-2">Reason: {c.rejectionReason}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700">
                        <div><strong>Phone:</strong> {c.mobileNumber || "N/A"}</div>
                        <div className="mt-2"><strong>Documents:</strong></div>
                        <div className="flex gap-2 mt-1">
                          {c.documents && c.documents.length > 0 ? (
                            c.documents.map((d, i) => (
                              <a key={i} href={`https://trucvstorage.blob.core.windows.net/uploads/${d}`} target="_blank" rel="noreferrer" className="text-sm px-3 py-1 rounded bg-[#006666] text-white">Doc {i+1}</a>
                            ))
                          ) : <span className="text-gray-500">No docs</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* User subscription modal (existing) */}
          {editingUser && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => closeModal()} aria-hidden />
              <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Edit Subscription</div>
                    <div className="mt-1 font-semibold text-lg flex items-center gap-3 break-all">
                      <span>{editingUser.email}</span>
                      <span className="px-2 py-0.5 rounded-md text-sm" style={{ border: "1px solid #e6e6e6", background: "rgba(3,37,126,0.03)", color: "#03257e" }}>
                        Current: {editingUser.subscriptionPlan}
                      </span>
                    </div>
                  </div>

                  <button onClick={() => closeModal()} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
                    <FaTimes />
                  </button>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Subscription</label>

                  <div className="flex items-center gap-4">
                    <button onClick={() => setNewPlan("Free")} className={`flex-1 py-2 rounded-lg border text-sm font-medium shadow-sm transition-colors`} style={{ background: newPlan === "Free" ? "#006666" : "transparent", color: newPlan === "Free" ? "white" : "#006666", borderColor: "#006666" }}>Free</button>
                    <button onClick={() => setNewPlan("Pro")} className={`flex-1 py-2 rounded-lg border text-sm font-medium shadow-sm transition-colors`} style={{ background: newPlan === "Pro" ? "#f14419" : "transparent", color: newPlan === "Pro" ? "white" : "#f14419", borderColor: "#f14419" }}>Pro</button>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">You are changing subscription for <strong>{editingUser.email}</strong> to <strong>{newPlan}</strong>.</div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button onClick={() => closeModal()} disabled={saving} className="px-4 py-2 rounded-lg border" style={{ borderColor: "#e6e6e6" }}>Cancel</button>

                  <button onClick={() => handleSubmit()} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold shadow" style={{ background: "#03257e" }}>
                    {saving ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    ) : (<FaCheck />)}
                    <span>{saving ? "Saving..." : "Save changes"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject modal */}
          {rejectModalOpen && selectedCompany && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setRejectModalOpen(false)} aria-hidden />
              <div className="relative max-w-md w-full bg-white rounded-2xl shadow-2xl p-6">
                <h3 className="text-lg font-semibold">Reject Company</h3>
                <p className="text-sm text-gray-600 mt-2">Provide a reason for rejecting <strong>{selectedCompany.companyName || selectedCompany.email}</strong> (optional).</p>

                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full mt-3 p-3 border rounded-lg h-32" placeholder="Reason (optional)"></textarea>

                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button onClick={() => submitReject()} className="px-4 py-2 rounded-lg bg-red-500 text-white">Reject</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <AccessDeniedPage />
      )}
    </>
  );
};

export default AdminUsersPage;

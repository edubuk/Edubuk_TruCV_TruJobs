import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AccessDeniedPage from "./AccessDenied";
import { API_BASE_URL } from "@/main";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";

const AdminUsersPage = () => {
  const [usersData, setUsersData] = useState<any>([]);
  const [checkAccess, setCheckAccess] = useState<boolean>(false);

  // modal / edit state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newPlan, setNewPlan] = useState<"Free" | "Pro">("Free");
  const [saving, setSaving] = useState<boolean>(false);

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
        return toast.error(data.message);
      }
      console.log("data", data);
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

      // Optimistically update UI
      setUsersData((prev: any[]) =>
        prev.map((u) =>
          u.email === editingUser.email ? { ...u, subscriptionPlan: newPlan } : u
        )
      );

      toast.success("Subscription updated");
      // keep modal open briefly to show success then close
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

  return (
    <>
      {checkAccess ? (
        <div className="min-h-screen bg-white p-6">
          <h1 className="text-3xl font-bold text-[#03257e] mb-6 text-center">
            Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {usersData.map((user: any) => (
              <div
                key={user._id}
                className="bg-white border rounded-2xl shadow-md p-5 flex flex-col gap-3"
                style={{ borderColor: "#006666" }}
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-[#03257e] break-all">
                    {user.email}
                  </h2>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-sm rounded-full font-medium bg-[#f14419] text-white">
                      {user.subscriptionPlan}
                    </span>

                    {/* Edit button */}
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
                        <a
                          key={idx}
                          href={`/cv/${id}`} // keep CV links as-is
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 text-sm font-medium rounded-lg shadow-sm transition
                                 bg-[#006666] text-white hover:bg-[#03257e]"
                        >
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

          {/* Modal */}
          {editingUser && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => closeModal()}
                aria-hidden
              />

              <div className="relative max-w-lg w-full bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Edit Subscription</div>
                    <div className="mt-1 font-semibold text-lg flex items-center gap-3 break-all">
                      <span>{editingUser.email}</span>
                      <span
                        className="px-2 py-0.5 rounded-md text-sm"
                        style={{
                          border: "1px solid #e6e6e6",
                          background: "rgba(3,37,126,0.03)",
                          color: "#03257e",
                        }}
                      >
                        Current: {editingUser.subscriptionPlan}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => closeModal()}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Subscription</label>

                  {/* Toggle style buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setNewPlan("Free")}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium shadow-sm transition-colors`}
                      style={{
                        background: newPlan === "Free" ? "#006666" : "transparent",
                        color: newPlan === "Free" ? "white" : "#006666",
                        borderColor: "#006666",
                      }}
                    >
                      Free
                    </button>

                    <button
                      onClick={() => setNewPlan("Pro")}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium shadow-sm transition-colors`}
                      style={{
                        background: newPlan === "Pro" ? "#f14419" : "transparent",
                        color: newPlan === "Pro" ? "white" : "#f14419",
                        borderColor: "#f14419",
                      }}
                    >
                      Pro
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    You are changing subscription for <strong>{editingUser.email}</strong> to{" "}
                    <strong>{newPlan}</strong>.
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => closeModal()}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg border"
                    style={{ borderColor: "#e6e6e6" }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleSubmit()}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold shadow"
                    style={{ background: "#03257e" }}
                  >
                    {saving ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    ) : (
                      <FaCheck />
                    )}
                    <span>{saving ? "Saving..." : "Save changes"}</span>
                  </button>
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

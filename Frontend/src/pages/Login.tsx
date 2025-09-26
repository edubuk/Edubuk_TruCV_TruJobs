// components/GoogleLoginWithHR.tsx
import React, { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import {jwtDecode} from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { uploadFile } from "@/uploadFile";
import { Check } from "lucide-react";

interface DecodedGooglePayload {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  exp?: number;
  email_verified?: boolean;
}

interface UploadResponse {
  data: {
    success: boolean;
    fileHashWithTimeStampExt: string;
    error?: string;
  };
  response?: {
    data: {
      success: boolean;
      error: string;
    };
  };
}

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const GoogleLoginWithHR: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    "confirm" | "companyForm" | "pending" | "idle"
  >("idle");
  const [uploading, setUploading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<DecodedGooglePayload | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [documents, setDocuments] = useState<File | null>(null);
  const navigate = useNavigate();
  const [uri, setUri] = useState<string>("");

  // Step 1: Google sign-in
  const handleGoogleLogin = async (credentialResponse: CredentialResponse | any) => {
    setInfoMessage(null);
    setLoading(true);
    try {
      const token = credentialResponse?.credential;
      if (!token) {
        setInfoMessage("No credential from Google.");
        setLoading(false);
        return;
      }

      const decoded = jwtDecode<DecodedGooglePayload>(token);
      setGoogleToken(token);
      setProfile(decoded || null);

      setCompanyName(decoded?.name ? `${decoded.name}'s Company` : "");
      setStep("confirm");
      setLoading(false);
    } catch (err) {
      console.error("Google login decode error", err);
      setInfoMessage("Google login failed. Try again.");
      setLoading(false);
    }
  };

  // Step 2: Continue as regular User → go to jobs page
  const onChooseUser = () => {
    if (!googleToken || !profile) {
      setInfoMessage("No login information available.");
      return;
    }
    localStorage.setItem("googleIdToken", googleToken);
    if (profile?.name) localStorage.setItem("userProfileName", profile.name);
    if (profile?.email) localStorage.setItem("email", profile.email);
    if (profile?.picture) localStorage.setItem("userImage", profile.picture);
    if (profile?.exp) localStorage.setItem("tokenExpiry", String(profile.exp));

    navigate("/"); // ✅ redirect Users to job listing
  };

  // Step 2: HR flow
  const onChooseHR = async () => {
    if (!googleToken) {
      setInfoMessage("Missing Google token. Please sign in again.");
      return;
    }
    setLoading(true);
    setInfoMessage(null);

    try {
      const res = await fetch(`${API_BASE}/hr/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${googleToken}` },
      });
     console.log(res);
      if (res.ok) {
        const data = await res.json();
        const hr = data.hr || data;
        localStorage.setItem("googleIdToken", googleToken);
        if (profile?.name) localStorage.setItem("userProfileName", profile.name);
        if (profile?.email) localStorage.setItem("email", profile.email);
        if (profile?.picture) localStorage.setItem("userImage", profile.picture);
        if (profile?.exp) localStorage.setItem("tokenExpiry", String(profile.exp));
        setLoading(false);

        if (hr.status && hr.status !== "approved") {
          navigate("/hr");
        } else {
          navigate("/hr"); // ✅ HR dashboard
        }
        return;
      }

      if (res.status === 403 || res.status === 404) {
        setLoading(false);
        setStep("companyForm"); // New HR → show company registration form
        return;
      }

      setInfoMessage("Could not verify HR status. Try again.");
      setLoading(false);
    } catch (err) {
      console.error("onChooseHR error", err);
      setInfoMessage("Server error while checking HR status.");
      setLoading(false);
    }
  };

  // Step 3: Submit company registration
  const submitCompanyRegistration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleToken) {
      setInfoMessage("Missing Google credentials. Please sign in again.");
      return;
    }
    if (!companyName.trim()) {
      setInfoMessage("Company name is required.");
      return;
    }

    setLoading(true);
    setInfoMessage(null);

    try {
      const payload = {
        name: profile?.name || "",
        companyName: companyName.trim(),
        mobileNumber: mobileNumber.trim() || undefined,
        address: address.trim() || undefined,
        documents: uri
          ? [uri]
          : [],
      };

      const res = await fetch(`${API_BASE}/hr/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        setStep("pending");
        setInfoMessage("Registered successfully. Awaiting admin approval.");
        setLoading(false);
        navigate("/hr"); // ✅ HR pending approval page
        return;
      }

      if (res.ok) {
        setInfoMessage("Account linked — redirecting to HR dashboard.");
        setLoading(false);
        navigate("/hr");
        return;
      }

      const data = await res.json();
      setInfoMessage(data?.message || "Registration failed.");
      setLoading(false);
    } catch (err) {
      console.error("submitCompanyRegistration error", err);
      setInfoMessage("Server error while registering company.");
      setLoading(false);
    }
  };


  const uploadDocuments = async () => {
    try {
      setUploading(true);
      const fromdata = new FormData();
      fromdata.append("file",documents || "");
      const res = await uploadFile(fromdata) as UploadResponse;
      if(res.data.success){
        setInfoMessage("Document uploaded successfully.");
        setUploading(false);
        setUri(res.data.fileHashWithTimeStampExt);
        console.log("Document uploaded successfully.",res?.data?.fileHashWithTimeStampExt);
      }
      
    } catch (error) {
      console.error(error);
      setInfoMessage("Document upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-[92%] max-w-lg bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-center text-[#03257E]">Sign in with Google</h2>
        <p className="text-sm text-center text-gray-600">
          Choose whether you are a regular User or an HR after signing in.
        </p>

        {step === "idle" && (
          <div className="flex flex-col items-center gap-3">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setInfoMessage("Google sign-in failed.")}
              useOneTap
            />
          </div>
        )}

        {step === "confirm" && profile && (
          <div className="flex flex-col gap-3 items-center">
            <img src={profile.picture} alt="avatar" className="w-16 h-16 rounded-full" />
            <div className="text-lg font-medium">{profile.name}</div>
            <div className="text-sm text-gray-500">{profile.email}</div>

            <div className="flex gap-3 mt-3">
              <button
                onClick={onChooseUser}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold"
              >
                Continue as User
              </button>
              <button
                onClick={onChooseHR}
                className="px-4 py-2 bg-green-600 text-white rounded font-semibold"
              >
                I'm an HR
              </button>
            </div>
          </div>
        )}

        {step === "companyForm" && (
          <form onSubmit={submitCompanyRegistration} className="flex flex-col gap-3">
            <label className="flex flex-col text-sm">
              Company name *
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 p-2 border rounded"
                required
              />
            </label>
            <label className="flex flex-col text-sm">
              Mobile number
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="mt-1 p-2 border rounded"
              />
            </label>
            <label className="flex flex-col text-sm">
              Address
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 p-2 border rounded"
              />
            </label>
            <label className="flex flex-col text-sm">
              Documents
              <div className="flex gap-2">
              <input
                type="file"
                onChange={(e) => setDocuments(e.target.files?.[0] || null)}
                className="mt-1 p-2 border rounded"
              />
              {!uri ? <button type="button" onClick={uploadDocuments} className="mt-1 py-2 px-4 rounded text-white font-semibold bg-[#006666]">{uploading ? "Uploading..." : "Upload"}</button>:<div className="flex items-center gap-2"><Check className="w-5 h-5" /> Uploaded</div>}
              </div>
            </label>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
              Submit Company
            </button>
          </form>
        )}

        {step === "pending" && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg font-medium">Registration submitted</div>
            <div className="text-sm text-gray-600 text-center">
              Your HR account is pending admin approval.
            </div>
          </div>
        )}

        {infoMessage && (
          <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded text-sm">{infoMessage}</div>
        )}
      </div>
    </div>
  );
};

export default GoogleLoginWithHR;

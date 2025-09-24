import { useEffect, useState } from "react";

/**
 * InvalidTokenModal.tsx
 *
 * Modern modal to show when the backend responds with "invalid token".
 * - Uses exact hex colors: #03257e (deep blue), #006666 (teal), #f14419 (accent)
 * - Tailwind utility classes for layout + inline styles for exact color values
 *
 * Usage:
 *  <InvalidTokenModal
 *    open={true}
 *    redirectUrl="/login"
 *    onClose={() => setShowModal(false)}
 *  />
 */

type Props = {
  open: boolean;
  onClose?: () => void;
  redirectUrl?: string;
  autoRedirect?: boolean; // auto redirect after countdown
  countdownStart?: number; // seconds
};

export default function InvalidTokenModal({
  open,
  onClose,
  redirectUrl = "/login",
  autoRedirect = true,
  countdownStart = 6,
}: Props) {
  const [count, setCount] = useState(countdownStart);

  useEffect(() => {
    if (!open) return;

    setCount(countdownStart);
    if (!autoRedirect) return;

    const t = setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [open, autoRedirect, countdownStart]);

  useEffect(() => {
    if (!autoRedirect) return;
    if (count <= 0 && open) {
      window.location.href = redirectUrl;
    }
  }, [count, autoRedirect, open, redirectUrl]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* modal card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-200 scale-100"
        style={{
          // subtle border using the deep blue color
          border: "1px solid rgba(3,37,126,0.06)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,251,0.98))",
        }}
      >
        {/* gradient header accent */}
        <div
          className="rounded-t-2xl px-6 py-5 flex items-center gap-4"
          style={{
            background: "linear-gradient(90deg, #03257e 0%, #006666 60%, #f14419 100%)",
            color: "white",
          }}
        >
          <div className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10">
            {/* lock icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c.828 0 1.5.672 1.5 1.5S12.828 14 12 14s-1.5-.672-1.5-1.5S11.172 11 12 11z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 11V9a5 5 0 10-10 0v2m12 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h14z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold leading-tight">Session expired</h3>
            <p className="text-sm opacity-90">Your authentication token is invalid or has expired.</p>
          </div>
        </div>

        {/* body */}
        <div className="px-6 py-6">
          <p className="text-sm text-gray-700 mb-4">
            For your security, please sign in again to continue. You will be redirected to the login page.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = redirectUrl)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-white font-medium shadow-sm"
              style={{ backgroundColor: "#03257e" }}
            >
              Sign in now
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="opacity-80">
              <circle cx="12" cy="12" r="10" stroke="#f14419" strokeWidth="1.4" />
            </svg>
            <span>
              Redirecting in <span style={{ color: "#f14419", fontWeight: 600 }}>{count}</span> seconds...
            </span>
          </div>
        </div>

        {/* footer tiny */}
        <div className="px-6 pb-5 text-xs text-gray-400 text-center">
          If you think this is a mistake, try clearing site data or contact support.
        </div>
      </div>
    </div>
  );
}

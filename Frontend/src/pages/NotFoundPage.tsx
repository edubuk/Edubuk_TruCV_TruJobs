import { motion } from "framer-motion";
import { SearchX, Home, ArrowLeft } from "lucide-react";

// Tailwind-only, modern responsive Not Found (404) page
// Colors: #03257e (navy), #006666 (teal), #f14419 (accent)

export default function NotFoundPage() {
  return (
    <div className="h-auto bg-white relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle at center, #f14419, transparent 60%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-1 -left-40 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle at center, #03257e, transparent 60%)" }}
      />

      <div className="relative z-10 flex h-auto items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-3xl"
        >
          <div className="grid gap-6 rounded-2xl p-8 md:p-12 bg-white/80 backdrop-blur">
            {/* Icon badge */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #f14419 0%, #03257e 100%)",
                  boxShadow: "0 10px 30px rgba(241,68,25,0.25)",
                }}
              >
                <SearchX className="h-8 w-8 text-white" />
              </motion.div>
            </div>

            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: "#f14419" }}>
                Page not found
              </h1>
              <p className="text-base md:text-lg text-gray-600">
                Sorry, we couldn’t find the page you’re looking for. The URL may be incorrect or the
                page might have been moved.
              </p>
              <p className="text-xs font-medium tracking-wider uppercase text-gray-500">Error code: <span style={{ color: "#03257e" }}>404</span></p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); if (typeof window !== 'undefined') window.history.back(); }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 font-semibold transition focus:outline-none focus:ring-4"
                style={{
                  borderColor: "#006666",
                  color: "#006666",
                }}
              >
                <ArrowLeft className="h-5 w-5" />
                Go back
              </a>

              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition text-white focus:outline-none focus:ring-4"
                style={{
                  background: "linear-gradient(135deg, #03257e 0%, #006666 100%)",
                  boxShadow: "0 8px 20px rgba(3,37,126,0.25)",
                }}
              >
                <Home className="h-5 w-5" />
                Go home
              </a>
            </div>

            {/* Tip / helper */}
            <div className="rounded-xl p-4 md:p-5 border bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#03257e" }} />
                <p className="text-sm text-gray-600">
                  Double‑check the spelling of the URL, or head back to the homepage to continue
                  browsing.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

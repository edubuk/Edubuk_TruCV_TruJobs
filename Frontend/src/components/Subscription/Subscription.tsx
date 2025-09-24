import React, { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { IoCloseCircleSharp } from "react-icons/io5";
import PaymentPopup from "../../paymentGateway/razorpay";

const accentBlue = "#03257e";
const accentTeal = "#006666";
const accentOrange = "#f14419";

const FeatureItem: React.FC<{ available: boolean; children: React.ReactNode }> = ({ available, children }) => (
  <li className="flex items-start gap-3 text-left">
    <span
      className={`mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md`}
      style={{
        background: available ? accentTeal : "transparent",
        color: available ? "white" : accentOrange,
        border: available ? "none" : `1px solid ${accentOrange}`,
      }}
    >
      {available ? <FaCheck className="w-3 h-3" /> : <IoCloseCircleSharp className="w-4 h-4" />}
    </span>
    <span className={`text-sm ${available ? "text-[#03257e]" : "text-[#03257e]"}`}>{children}</span>
  </li>
);

const PlanCard: React.FC<{
  title: string;
  price: React.ReactNode;
  features: { label: string; available: boolean }[];
  isCurrent?: boolean;
  onPrimaryClick?: () => void;
}> = ({ title, price, features, isCurrent, onPrimaryClick }) => {
  return (
    <div className="rounded-2xl p-6 shadow-md" style={{ border: `1px solid rgba(3,37,126,0.06)`, background: "white" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold" style={{ color: accentBlue }}>
          {title}
        </h3>
        <div
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: title === "Pro Plan" ? `linear-gradient(90deg, ${accentBlue}, ${accentTeal})` : "rgba(0,0,0,0.04)",
            color: title === "Pro Plan" ? "white" : accentBlue,
          }}
        >
          {title === "Pro Plan" ? "Popular" : "Free"}
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {features.map((f) => (
          <FeatureItem key={f.label} available={f.available}>
            {f.label}
          </FeatureItem>
        ))}
      </ul>

      <div className="mt-6">
        <div className="text-3xl font-extrabold" style={{ color: accentOrange }}>
          {price}
        </div>
        <div className="mt-3 flex items-center gap-3">
          {isCurrent ? (
            <button
              disabled
              className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 cursor-not-allowed w-full"
            >
              Current Plan
            </button>
          ) : (
            <button
              onClick={onPrimaryClick}
              className="w-full px-4 py-2 rounded-lg font-semibold transition-transform transform hover:-translate-y-0.5"
              style={{
                color: "white",
                background: `linear-gradient(90deg, ${accentBlue}, ${accentTeal})`,
                boxShadow: `0 6px 18px rgba(3,37,126,0.12)`,
              }}
            >
              {title === "Pro Plan" ? "Upgrade to Pro" : "Select"}
            </button>
          )}
        </div>
        {title === "Pro Plan" && (
          <div className="mt-2 text-xs text-gray-400">
            <i>18% GST included</i>
          </div>
        )}
      </div>
    </div>
  );
};

const SubscriptionPlans = () => {
  const [currentPlan] = useState<"Free" | "Pro" | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const freeFeatures = [
    { label: "Sharable Link of Edubuk design CV", available: true },
    { label: "Sharable Link of Template CV", available: true },
    { label: "Downloadable", available: false },
  ];

  const proFeatures = [
    { label: "Sharable Link of Edubuk design CV", available: true },
    { label: "Sharable Link of Template CV", available: true },
    { label: "Downloadable", available: true },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: accentBlue }}>
              Subscription Plans
            </h1>
            <p className="text-sm text-gray-500">Choose a plan that fits your needs.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlanCard
            title="Free Plan"
            price={<span>₹0/year</span>}
            features={freeFeatures}
            isCurrent={currentPlan === "Free"}
            onPrimaryClick={() => {
              window.location.href = "/";
            }}
          />

          <PlanCard
            title="Pro Plan"
            price={<>
              <div>₹590/(6 months)</div>
            </>}
            features={proFeatures}
            isCurrent={currentPlan === "Pro"}
            onPrimaryClick={() => setShowPopup(true)}
          />
        </div>

        <div className="mt-8">
          <PaymentPopup showPopup={showPopup} setShowPopup={setShowPopup} />
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;

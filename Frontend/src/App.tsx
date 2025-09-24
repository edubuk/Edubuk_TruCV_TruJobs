import { Routes, Route} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { OktoClientConfig,OktoProvider } from "@okto_web3/react-sdk";
import Navbar from "./pages/Navbar";
import ThreeDotLoader from "./components/Loader/ThreeDotLoader";

// Lazy-loaded pages
const HomePage = lazy(() => import("./pages/HomePage"));
const CvOutputPage = lazy(() => import("./pages/CvOutputPage"));
const Home = lazy(() => import("./pages/Home"));
const DashBoard = lazy(() => import("./pages/DashBoard"));
const Resume = lazy(() => import("./pages/ResumeTem"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const About = lazy(() => import("./pages/About"));
const TermsAndConditions = lazy(() => import("./pages/TermCond"));
const CancellationPolicy = lazy(() => import("./pages/CancellationPol"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
import AOS from "aos";
import "aos/dist/aos.css";
import AppPrivacyPolicy from "./pages/AppPrivacy";
import SubscriptionPlans from "./components/Subscription/Subscription";
import GoogleLoginModal from "./pages/Login";
import ProtectedRoute from "./protectRoute";
import AdminUsersPage from "./pages/Admin";
import { googleLogout } from "@react-oauth/google";
import InvalidTokenModal from "./pages/InvalidTokenModel";


function App() {
   const config: OktoClientConfig = {
      environment:"production",
      clientPrivateKey:import.meta.env.VITE_OKTO_CLIENT_PRIVATE_KEY,
      clientSWA:import.meta.env.VITE_OKTO_CLIENT_SWA,
    };

      useEffect(() => {
    AOS.init({
      duration: 1000, // animation duration in ms
      once: false,     // whether animation should happen only once
    });
  }, []);

    const handlerLogout = () => {
      try {
              googleLogout();    // Perform Google OAuth logout and remove stored token  
              localStorage.removeItem("googleIdToken");
              localStorage.removeItem("email");
              localStorage.removeItem("userName");
              localStorage.removeItem("userImage");
              localStorage.removeItem("tokenExpiry");
              window.location.href="/";
              return { result: "Logout success" };
          } catch (error) {
              console.error("Logout failed:", error);
              return { result: "Logout failed" };
          }
    };

  return (
    <div>
        <OktoProvider  config={config}>
          <Navbar handlerLogout={handlerLogout}/>
          <Suspense fallback={<div className="flex justify-center items-center text-3xl text-[#03257e] font-bold h-[80vh]" data-aos="zoom-in">Loading {""} <ThreeDotLoader w={2} h={2} yPos={'end'} /></div>}>
            <Routes>
              <Route
                path="/"
                element={<Home handlerLogout={handlerLogout}/>}
              />
              <Route path="/invalid-token" element={<InvalidTokenModal open={true} redirectUrl="/login"/>}></Route>
              <Route path="*" element={<NotFoundPage />} />
              <Route path="/new-cv/:id" element={<Resume />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/about-us" element={<About />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/cancellation-policy" element={<CancellationPolicy />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/pprivacy-policy" element={<AppPrivacyPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/login" element={<GoogleLoginModal />} />
              <Route path="/cv/:id" element={<CvOutputPage />} />
              <Route path="/admin" element={<AdminUsersPage/>} />
              <Route path="/subscription" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
                <Route path="/create-cv" element={<HomePage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashBoard /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </OktoProvider>
    </div>
  );
}

export default App;

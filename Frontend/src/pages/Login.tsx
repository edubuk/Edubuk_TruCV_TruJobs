import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
interface UserLoginData {
    name: string;
    email: string;
    picture: string;
    exp: number;
}
const GoogleLoginModal = ()=>{
    const [loading,setLoading] = useState(false);
    const hidePopup = ()=>{
        setLoading(false);
    }
    const handleGoogleLogin = (credentialResponse: any) => {
        setLoading(true);
            const userData:UserLoginData = jwtDecode(credentialResponse.credential);
            localStorage.setItem('userProfileName', userData?.name);
            localStorage.setItem('email', userData?.email);
            localStorage.setItem('userImage', userData?.picture);
            localStorage.setItem('googleIdToken', credentialResponse.credential);
            localStorage.setItem('tokenExpiry', userData?.exp.toString());
            window.location.href = '/';
      };
    
    return(
        <div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
  onClick={hidePopup}
  aria-modal="true"
  role="dialog"
>
  <div
    className="relative w-[90%] max-w-sm bg-white rounded-lg shadow-lg p-6 flex flex-col gap-5 animate-fade-in transform transition-transform duration-300 scale-100 opacity-100"
    onClick={(e) => e.stopPropagation()}
  >
    {/* Modal Header */}
    <h2 className="text-2xl font-semibold text-center text-[#03257E]">Sign in with Google</h2>
    <p className="text-sm text-center text-gray-600">
      Use your Google account to continue securely.
    </p>

    {/* Google Login Button */}
    <GoogleLogin
      onSuccess={handleGoogleLogin}
      onError={
        ((error: any) => {
          console.log("Login Failed", error);
        }) as () => void
      }
      useOneTap
      promptMomentNotification={(notification) =>
        console.log("Prompt moment notification:", notification)
      }
    />

    {/* Close Button */}
    {loading?<p className="mt-2 px-4 py-2 bg-white text-[#03257e] font-semibold rounded text-center">Please Wait...</p>:
    <Link
      to="/"
      className="mt-2 px-4 py-2 bg-red-500 text-white text-center font-semibold rounded hover:bg-red-600 transition"
      aria-label="Close Google login modal"
    >
      Close
    </Link>}
  </div>
</div>
    )
}

export default GoogleLoginModal;
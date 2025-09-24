import React, { useState, useEffect } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
//import Razorpay from "razorpay";
import SmallLoader from "@/components/Loader/Loader";
import { API_BASE_URL } from "@/main";
interface Props {
  showPopup: boolean;
  setShowPopup: React.Dispatch<React.SetStateAction<boolean>>;
}

interface payload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  couponCode?: string;
  userMailId: string;
}

const PaymentPopup: React.FC<Props> = ({ showPopup, setShowPopup}) => {
  const [coupon, setCoupon] = useState<string>("");
  const [errorMsg,setErrorMsg] = useState<string>("");
  const [amount, setAmount] = useState<number>(590);
  const [isCouponValid, setCouponValid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currType,setCurrType] = useState<string>("INR");
  const navigate = useNavigate();

  const checkOutHandler = async () => {
    try {
      console.log("test key",import.meta.env.VITE_Rz_Key);
      console.log("test secret",API_BASE_URL);
      setLoading(true);
      const orderRes = await axios.post(
        `${API_BASE_URL}/cv/checkout`,
        { amount: amount * 100,
          currType:currType
         }, // Send amount in paise
        { headers: { 
          "Content-Type": "application/json",
        } }
      );

      if (orderRes.data.success) {
        const options = {
          key: import.meta.env.VITE_Rz_Key,
          amount: amount* 100,
          currency:currType,
          name: "Edubuk (Eduprovince Technologies Private Limited)",
          description: "",
          order_id: orderRes.data.order.id,
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const payload: payload = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                userMailId: localStorage.getItem("email")!,
              };

              // Add coupon code to payload if it exists
              if (coupon) {
                payload.couponCode = coupon;
              }

              const res = await axios.post(
                `${API_BASE_URL}/cv/payment_verification`,
                payload,
                { headers: { "Content-Type": "application/json" } }
              );

              if (res.data.success) {
                toast.success("Payment successful.");
                setShowPopup(false);
                setLoading(false);
                localStorage.setItem("paymentId", res.data.paymentId);
                navigate("/");
                  } else {
                toast.error("Payment verification failed.");
                setLoading(false);
              }
            } catch (error) {
              console.error("Error during payment verification:", error);
              toast.error("Something went wrong.");
              setLoading(false);
            }
          },
          theme: { color: "#006666" },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        console.error("Order creation failed.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error during checkout:", err);
      setLoading(false);
    }
  };

  const verifyCoupon = async () => {
    try {
      const query = `?couponCode=${coupon}&currType=${currType}&userMailId=${localStorage.getItem("email")}`
      const res = await axios.get(
        `${API_BASE_URL}/cv/coupon_verify${query}`
      );
      //console.log("coupon log", res);
      if (res.data.success && res.data.applied) {
        if(res.data.value===0)
        {
          toast.success(res.data.message);
          setAmount(0);
          setShowPopup(false);
          window.location.href="/";
        }
        else{
        console.log("coupon log", res);
        setAmount(res.data.value);
        toast.success(res.data.message);
        setCouponValid(true);
        }
      } else {
        setAmount(res.data.value);
        setErrorMsg(res.data.message);
        setCouponValid(false);
      }
    } catch (error) {
      console.log("error while coupon verification");
    }
  };

  const couponHandler = (e:any) => {
    e.preventDefault();
    setCoupon(e.target.value);
    if(errorMsg){
      setErrorMsg("");
    }
  };

  useEffect(() => {
    // Dynamically add Razorpay script to the document
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    // Clean up script on component unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 h-full w-full">
          <div className="relative w-11/12 max-w-4xl bg-white rounded-lg shadow-lg">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setShowPopup(false)}
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 p-4 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200">
                <img
                  src="/animatedResume.jpg"
                  alt="Resume Animation"
                  className="w-80 h-80 object-cover"
                />
              </div>
              <div className="w-full md:w-1/2 p-6">
                {isCouponValid ? (
                  <h2 className="text-xl text-[#03257e] font-semibold mb-4 animate-bounce">
                    Hurray!! You got an amazing discount 🎉
                  </h2>
                ) : (
                  <h2 className="text-xl text-[#03257e] font-semibold mb-4">
                    Enter coupon code and get an amazing discount
                  </h2>
                )}
                <div className="relative">
                  {(isCouponValid || amount===0) && <ConfettiExplosion zIndex={60} />}
                  <div className="flex justify-between gap-2">
                    <input
                      type="text"
                      onChange={(e) => couponHandler(e)}
                      value={coupon}
                      placeholder="Enter Coupon Code"
                      className="w-full px-4 py-2 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      className="px-4 py-2 mb-6 bg-[#006666] text-[white] rounded active:translate-y-1 cursor-pointer"
                      onClick={verifyCoupon}
                    >
                      Apply
                    </button>
                  </div>
                  {coupon?.length > 0 && amount === 590 && (
                    <p className="absolute text-[red] bottom-[0.01rem]">
                      {errorMsg}
                    </p>
                  )}
                  {/* {isCouponValid && (
                    <p className="absolute text-[#ff6a00] bottom-[0.01rem]">
                      valid till 30 JULY 2025
                    </p>
                  )} */}
                </div>
                <div className="flex items-center gap-4 mt-4">
                  {/* <p className="text-xl">
                    <strong>₹</strong>
                    {isCouponValid ? (
                      <strong className="text-[#006666]">
                        <del>599</del> 89
                      </strong>
                    ) : (
                      <strong className="text-[#006666]">599</strong>
                    )}{" "}
                    Only
                  </p> */}

                <div className="w-full p-2">
                <h2 className="text-[#006666] text-xl font-semibold mb-4">
                  Choose your currency as per your country
                </h2>

                <div className="relative"></div>
                <div className="flex items-center gap-4 mt-4">
                  <p className="text-xl text-[#03257e]">
                  <strong className="text-[#006666]">{currType} {isCouponValid&&<del>599</del>} {amount}</strong>{" "}
                    only
                  </p>
                  {!loading ? (
                    <div className="flex flex-col gap-2">
                      <div className="relative inline-block w-auto">
                        <select
                          onChange={(e: any) => {
                            setCurrType(e.target.value);
                            e.target.value === "INR"
                              ? setAmount(590)
                              : e.target.value === "USD"? setAmount(30)
                              :setAmount(50);
                          }}
                          className="w-full px-2 py-1 border text-center border-gray-300 rounded-md text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                          <option value="">Select Currency</option>
                          <option value="INR">INR</option>
                          <option value="AED">AED</option>
                          <option value="SGD">SGD</option>
                          <option value="USD">USD</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                          ▼
                        </div>
                      </div>
                      <button
                        className="rounded-lg bg-[#007bff] py-2 px-4 text-white cursor-pointer active:translate-y-1"
                        onClick={checkOutHandler}
                      >
                        Proceed To Pay
                      </button>
                    </div>
                  ) : (
                    <SmallLoader />
                  )}
                </div>
              </div>

                  {/* {!loading?<button
                    className="rounded-lg bg-[#007bff] py-2 px-4 text-white cursor-pointer active:translate-y-1"
                    onClick={checkOutHandler}
                  >
                    Pay Now To Submit CV
                  </button>:<SmallLoader />} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentPopup;

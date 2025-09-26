import { API_BASE_URL } from "@/main";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserContextType {
  userEmail: string;
  subscriptionPlan: string;
  nanoId: string[];
}

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [userData, setUserData] = useState<UserContextType>({
    userEmail: "",
    subscriptionPlan: "Free",
    nanoId: []
  });

  useEffect(() => {
    const fetchData = async () => {
      const loginMailId = localStorage.getItem("email");
      if (!loginMailId) {
        console.warn("No login email found in localStorage");
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/cv/getCvIds/${loginMailId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("googleIdToken")}`,
          },
        });

        const data = await response.json();
        console.log("User response", data);

        if (!data.success) {
          console.error(data.message);
          return;
        }
        console.log("user-data",data.email,data.subscriptionPlan)
        setUserData({
          userEmail: data.userData.email || "",
          subscriptionPlan: data.userData.subscriptionPlan || "Free",
          nanoId: data.userData.nanoIds || []
        });

        console.log("user-data",userData.userEmail,userData.subscriptionPlan)
      } catch (err) {
        toast.error("Something went wrong while fetching user data");
        console.log("Error fetching user plan", err);
      }
    };

    fetchData();
  }, []);

  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserData must be used within UserContextProvider");
  return context;
};

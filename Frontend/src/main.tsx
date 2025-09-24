import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CvFomContextProvider } from "./context/CvForm.context.tsx";
import { UserContextProvider } from "./context/AuthContext.tsx";
import { QueryClient, QueryClientProvider } from "react-query";
import {Toaster} from 'react-hot-toast';
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Buffer } from "buffer";
import process from "process";
window.Buffer = Buffer;
window.process = process;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
//console.log("google client id",GOOGLE_CLIENT_ID);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CvFomContextProvider>
      <UserContextProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
      <GoogleOAuthProvider clientId = {GOOGLE_CLIENT_ID}>
        <App />
        </GoogleOAuthProvider>
      </BrowserRouter>
      </UserContextProvider>
      </CvFomContextProvider>
    </QueryClientProvider>
  </StrictMode>
);
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

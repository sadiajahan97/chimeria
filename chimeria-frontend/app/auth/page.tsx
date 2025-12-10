"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/api";
import { SignInForm } from "./components/sign-in-form";
import { SignUpForm } from "./components/sign-up-form";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const router = useRouter();

  const { data, isSuccess } = useQuery({
    queryKey: ["check-auth"],
    queryFn: async () => {
      const response = await checkAuth();
      return response.data;
    },
  });

  useEffect(() => {
    if (isSuccess && data.authenticated) {
      sessionStorage.setItem("access-token", data.accessToken || "");
      router.push("/");
    }
  }, [isSuccess, data, router]);

  const authTitle = activeTab === 0 ? "Welcome Back" : "Create Account";
  const authSubtitle =
    activeTab === 0
      ? "Enter your credentials to access your account"
      : "Sign up to start analyzing images with AI";

  const handleSwitchTab = (tab: 0 | 1) => setActiveTab(tab);

  return (
    <main className="min-h-screen flex items-center justify-center p-5 bg-[linear-gradient(127deg,#0f172a_0%,#1e293b_47%,#334155_100%)] [@media(max-width:480px)]:p-0">
      <div className="flex max-w-[1100px] w-full bg-white rounded-[16px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.24)] [@media(max-width:968px)]:flex-col [@media(max-width:480px)]:rounded-none">
        <div className="relative flex-1 flex flex-col justify-between text-white bg-gradient-[165deg,#2563eb_0%,#1e40af_100%] overflow-hidden [@media(max-width:968px)]:p-[40px_30px] [@media(max-width:480px)]:p-[30px_20px] p-[60px_50px]">
          <div className="absolute top-[-50%] right-[-20%] w-[400px] h-[400px] bg-white/8 rounded-full pointer-events-none" />
          <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] bg-white/6 rounded-full pointer-events-none" />

          <div className="relative z-1">
            <h1 className="text-[28px] font-bold mb-3 tracking-[-0.5px] [@media(max-width:480px)]:text-[24px]">
              AI Vision Platform
            </h1>
            <p className="text-[15px] opacity-[0.92] leading-[1.6] font-light">
              Advanced object detection and intelligent analysis powered by
              state-of-the-art machine learning models
            </p>
          </div>

          <div className="relative z-1 mt-10 [@media(max-width:968px)]:mt-[30px]">
            <div className="flex items-start mb-[28px] [@media(max-width:968px)]:mb-[20px]">
              <div className="w-[44px] h-[44px] bg-white/15 rounded-[10px] flex items-center justify-center mr-[18px] shrink-0 backdrop-blur-[10px]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[22px] h-[22px] stroke-white stroke-2 fill-none"
                >
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="text-[16px] font-semibold mb-[6px]">
                  YOLO Object Detection
                </h3>
                <p className="text-[14px] opacity-[0.88] leading-1.5 font-light">
                  Real-time object detection with industry-leading accuracy and
                  performance metrics
                </p>
              </div>
            </div>

            <div className="flex items-start mb-[28px] [@media(max-width:968px)]:mb-[20px]">
              <div className="w-[44px] h-[44px] bg-white/15 rounded-[10px] flex items-center justify-center mr-[18px] shrink-0 backdrop-blur-[10px]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[22px] h-[22px] stroke-white stroke-2 fill-none"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="text-[16px] font-semibold mb-[6px]">
                  AI-Powered Q&A
                </h3>
                <p className="text-[14px] opacity-[0.88] leading-1.5 font-light">
                  Ask questions about detected objects using Gemini&apos;s
                  advanced natural language understanding
                </p>
              </div>
            </div>

            <div className="flex items-start mb-[28px] [@media(max-width:968px)]:mb-[20px]">
              <div className="w-[44px] h-[44px] bg-white/15 rounded-[10px] flex items-center justify-center mr-[18px] shrink-0 backdrop-blur-[10px]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[22px] h-[22px] stroke-white stroke-2 fill-none"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div className="feature-content">
                <h3 className="text-[16px] font-semibold mb-[6px]">
                  Interactive Analysis
                </h3>
                <p className="text-[14px] opacity-[0.88] leading-1.5 font-light">
                  Sortable results with detailed confidence scores and bounding
                  box coordinates
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center p-[60px_50px] [@media(max-width:968px)]:p-[40px_30px] [@media(max-width:480px)]:p-[30px_20px]">
          <div className="mb-[36px]">
            <h2 className="text-[32px] font-bold text-[#0f172a] mb-2 tracking-[-0.8px] [@media(max-width:480px)]:text-[26px]">
              {authTitle}
            </h2>
            <p className="text-[15px] text-[#64748b] font-normal">
              {authSubtitle}
            </p>
          </div>

          <div className="flex gap-2 mb-8 bg-[#f1f5f9] p-1.5 rounded-[10px]">
            <button
              className={`flex-1 px-6 py-3 bg-transparent border-none text-[#64748b] text-[15px] font-semibold rounded-[7px] cursor-pointer transition-all duration-300 ease-in-out font-inter${
                activeTab === 0
                  ? " bg-white text-[#2563eb] shadow-[0_2px_8px_rgba(37,99,235,0.12)]"
                  : ""
              }`}
              onClick={() => handleSwitchTab(0)}
            >
              Sign In
            </button>
            <button
              className={`flex-1 px-6 py-3 bg-transparent border-none text-[#64748b] text-[15px] font-semibold rounded-[7px] cursor-pointer transition-all duration-300 ease-in-out font-inter${
                activeTab === 1
                  ? " bg-white text-[#2563eb] shadow-[0_2px_8px_rgba(37,99,235,0.12)]"
                  : ""
              }`}
              onClick={() => handleSwitchTab(1)}
            >
              Sign Up
            </button>
          </div>
          {activeTab === 0 ? <SignInForm /> : <SignUpForm />}
        </div>
      </div>
    </main>
  );
}

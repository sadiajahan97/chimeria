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
      : "Sign up to chat with Chimeria";

  const handleSwitchTab = (tab: 0 | 1) => setActiveTab(tab);

  return (
    <main className="min-h-screen flex items-center justify-center p-5 bg-[linear-gradient(127deg,#0f172a_0%,#1e293b_47%,#334155_100%)] [@media(max-width:480px)]:p-0">
      <div className="flex max-w-[1100px] w-full bg-white rounded-[16px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.24)] [@media(max-width:968px)]:flex-col [@media(max-width:480px)]:rounded-none">
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

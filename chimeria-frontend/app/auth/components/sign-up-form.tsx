"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { signUp } from "@/api";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<SignUpFormData>();

  const router = useRouter();

  const handleToggleShowPassword = () => setShowPassword(!showPassword);

  const handleToggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const signUpMutation = useMutation({
    mutationFn: (data: SignUpFormData) =>
      signUp(data.email, data.password, data.name),
    onSuccess: (response) => {
      sessionStorage.setItem("access-token", response.data.accessToken);
      setError(null);
      reset();
      router.push("/");
    },
    onError: (error: AxiosError) => {
      if (error.response?.status === 409) {
        setError("Email already registered");
      } else {
        setError("An error occurred. Please try again.");
      }
    },
  });

  const onSubmit = (data: SignUpFormData) =>
    signUpMutation.mutate({
      ...data,
      name: data.name.trim(),
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-600 rounded-[10px]">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="mb-[22px]">
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Full Name
        </label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 stroke-[#94a3b8] stroke-2 fill-none"
            viewBox="0 0 24 24"
          >
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            type="text"
            id="name"
            placeholder="John Doe"
            {...register("name", {
              required: "Name is required",
              minLength: {
                value: 1,
                message: "Name cannot be empty",
              },
            })}
            className={`focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] w-full py-[14px] pr-4 pl-12 border-[1.5px] ${
              errors.name ? "border-red-600" : "border-[#e2e8f0]"
            } rounded-[10px] text-[15px] font-inter transition-all duration-300 ease-in-out text-[#0f172a]`}
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="mb-[22px]">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Email Address
        </label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 stroke-[#94a3b8] stroke-2 fill-none"
            viewBox="0 0 24 24"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <input
            type="email"
            id="email"
            placeholder="you@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value:
                  /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:\\[\x00-\x7F]|[^\\"])*")@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/,
                message: "Invalid email address",
              },
            })}
            className={`focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] w-full py-[14px] pr-4 pl-12 border-[1.5px] ${
              errors.email ? "border-red-600" : "border-[#e2e8f0]"
            } rounded-[10px] text-[15px] font-inter transition-all duration-300 ease-in-out text-[#0f172a]`}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="mb-[22px]">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Password
        </label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 stroke-[#94a3b8] stroke-2 fill-none"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Create a password"
            {...register("password", {
              required: "Password is required",
              pattern: {
                value:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;':",.<>\/?]).{12,}$/,
                message:
                  "Password must be at least 12 characters long and must include at least one uppercase, lowercase, number, and special character",
              },
            })}
            className={`focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] w-full py-[14px] pr-4 pl-12 border-[1.5px] ${
              errors.password ? "border-red-600" : "border-[#e2e8f0]"
            } rounded-[10px] text-[15px] font-inter transition-all duration-300 ease-in-out text-[#0f172a]`}
          />
          <button
            onClick={handleToggleShowPassword}
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 stroke-slate-400 stroke-2 fill-none"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="mb-[22px]">
        <label
          htmlFor="confirm-password"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Confirm Password
        </label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 stroke-[#94a3b8] stroke-2 fill-none"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirm-password"
            placeholder="Confirm your password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) =>
                value === getValues("password") || "Passwords do not match",
            })}
            className={`focus:outline-none focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] w-full py-[14px] pr-4 pl-12 border-[1.5px] ${
              errors.confirmPassword ? "border-red-600" : "border-[#e2e8f0]"
            } rounded-[10px] text-[15px] font-inter transition-all duration-300 ease-in-out text-[#0f172a]`}
          />
          <button
            onClick={handleToggleShowConfirmPassword}
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 stroke-slate-400 stroke-2 fill-none"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={signUpMutation.isPending}
        className="hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] w-full p-[15px] bg-linear-to-br from-[#2563eb] to-[#1e40af] text-white border-0 rounded-[10px] text-[16px] font-semibold cursor-pointer transition-all duration-300 ease-in-out font-inter shadow-[0_4px_12px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {signUpMutation.isPending ? "Creating Account..." : "Create Account"}
      </button>

      <div className="flex items-center my-7">
        <div className="flex-1 h-px bg-[#e2e8f0]" />
        <span className="px-4 text-[13px] text-[#94a3b8] font-medium">
          OR CONTINUE WITH
        </span>
        <div className="flex-1 h-px bg-[#e2e8f0]" />
      </div>

      <button
        type="button"
        className="w-full py-3.5 px-3.5 bg-white text-slate-800 border-[1.5px] border-slate-200 rounded-xl text-[15px] font-semibold cursor-pointer transition-all duration-300 ease-in-out font-inter flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign up with Google
      </button>
    </form>
  );
};

"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getProfile, signOut } from "@/api";
import { getInitials } from "@/utils";
import { useProfile, Profile } from "@/app/contexts/profile";
import { useRouter } from "next/navigation";

export const Header = () => {
  const { profile, setProfile } = useProfile();

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfile();
      setProfile(response.data as Profile);
      return response.data as Profile;
    },
    enabled: !profile,
  });

  const router = useRouter();

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      sessionStorage.removeItem("access-token");
      localStorage.removeItem("access-token");
      setProfile(null);
      router.push("/auth");
    },
  });

  const handleLogout = () => signOutMutation.mutate();

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <h1>AI Vision Platform</h1>
        </div>
        <div className="user-menu">
          {!isLoading && !error && (
            <div className="user-info">
              <div className="avatar">
                {getInitials(profile?.name || data?.name || "")}
              </div>
              <div className="user-details">
                <div className="user-name">
                  {profile?.name || data?.name || ""}
                </div>
                <div className="user-email">
                  {profile?.email || data?.email || ""}
                </div>
              </div>
            </div>
          )}
          <button
            className="logout-btn"
            onClick={handleLogout}
            disabled={signOutMutation.isPending}
          >
            {signOutMutation.isPending ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
};

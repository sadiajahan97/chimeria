"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  Dispatch,
  SetStateAction,
} from "react";

export interface Profile {
  name: string;
  email: string;
}

interface ProfileContextType {
  profile: Profile | null;
  setProfile: Dispatch<SetStateAction<Profile | null>>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useProfile must be used within a ProfileContextProvider");
  else return context;
};

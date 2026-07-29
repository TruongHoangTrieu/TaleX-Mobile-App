import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getUserFeatureProfile,
  createUserFeatureProfile,
} from "@/services/userFeature";
import {
  UserFeatureProfile,
  CreateUserFeatureRequest,
} from "@/types/userFeature";

export function useUserFeature() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserFeatureProfile | null>(null);
  const [isMissingProfile, setIsMissingProfile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsMissingProfile(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserFeatureProfile();
      setProfile(result.data);
      setIsMissingProfile(result.isMissing);
    } catch (err: any) {
      console.error("[useUserFeature] Error fetching user feature profile:", err);
      setError(err.message || "Failed to fetch user features");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async (payload: CreateUserFeatureRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await createUserFeatureProfile(payload);
      setProfile(updated);
      setIsMissingProfile(false);
      return updated;
    } catch (err: any) {
      console.error("[useUserFeature] Error saving user feature profile:", err);
      setError(err.message || "Failed to save user features");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isMissingProfile,
    isLoading,
    error,
    refetch: fetchProfile,
    saveProfile,
  };
}

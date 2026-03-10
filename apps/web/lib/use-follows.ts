"use client";

import { useCallback, useEffect, useState } from "react";
import type { FollowType } from "@agora/shared";
import { apiClient } from "@/lib/api";
import { getOrCreateDeviceId } from "@/lib/device-id";

export interface FollowsState {
  follows: {
    deputy: string[];
    bill: string[];
    group: string[];
  };
  loading: boolean;
  error: string | null;
}

export function useFollows() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [follows, setFollows] = useState<FollowsState["follows"]>({
    deputy: [],
    bill: [],
    group: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const id = getOrCreateDeviceId();
    if (!id) {
      setLoading(false);
      return;
    }
    setDeviceId(id);
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getFollows(id);
      setFollows(data.follows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setFollows({ deputy: [], bill: [], group: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const isFollowing = useCallback(
    (type: FollowType, id: string) => {
      const list = follows[type];
      return list.includes(id);
    },
    [follows]
  );

  const follow = useCallback(
    async (type: FollowType, id: string) => {
      const id_ = deviceId ?? getOrCreateDeviceId();
      if (!id_) return;
      try {
        await apiClient.follow(id_, type, id);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    },
    [deviceId, refetch]
  );

  const unfollow = useCallback(
    async (type: FollowType, id: string) => {
      const id_ = deviceId ?? getOrCreateDeviceId();
      if (!id_) return;
      try {
        await apiClient.unfollow(id_, type, id);
        await refetch();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    },
    [deviceId, refetch]
  );

  return {
    follows,
    loading,
    error,
    isFollowing,
    follow,
    unfollow,
    refetch
  };
}

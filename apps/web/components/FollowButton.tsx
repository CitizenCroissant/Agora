"use client";

import { useState } from "react";
import type { FollowType } from "@agora/shared";
import { useFollows } from "@/lib/use-follows";
import styles from "./FollowButton.module.css";

export interface FollowButtonProps {
  followType: FollowType;
  followId: string;
  /** Optional label when not following, e.g. "Suivre ce député" */
  followLabel?: string;
  /** Optional label when following, e.g. "Ne plus suivre" */
  unfollowLabel?: string;
  className?: string;
}

const DEFAULT_FOLLOW: Record<FollowType, string> = {
  deputy: "Suivre ce député",
  bill: "Suivre ce dossier",
  group: "Suivre ce groupe"
};

const DEFAULT_UNFOLLOW: Record<FollowType, string> = {
  deputy: "Ne plus suivre",
  bill: "Ne plus suivre",
  group: "Ne plus suivre"
};

export function FollowButton({
  followType,
  followId,
  followLabel,
  unfollowLabel,
  className
}: FollowButtonProps) {
  const { isFollowing, follow, unfollow, loading: followsLoading } = useFollows();
  const [actionLoading, setActionLoading] = useState(false);

  const following = isFollowing(followType, followId);
  const loading = followsLoading || actionLoading;

  const labelFollow = followLabel ?? DEFAULT_FOLLOW[followType];
  const labelUnfollow = unfollowLabel ?? DEFAULT_UNFOLLOW[followType];

  const handleClick = async () => {
    setActionLoading(true);
    try {
      if (following) {
        await unfollow(followType, followId);
      } else {
        await follow(followType, followId);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={[styles.button, following ? styles.following : styles.notFollowing, className].filter(Boolean).join(" ")}
      aria-pressed={following}
      aria-busy={loading}
    >
      {loading ? "..." : following ? labelUnfollow : labelFollow}
    </button>
  );
}

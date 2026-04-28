"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { SubmissionStatus } from "../../server/services/submissions.service";

type SubmissionStatusAutoRefreshProps = {
  initialStatus: SubmissionStatus;
  initialUpdatedAt: string;
  pollMs?: number;
  submissionId: string;
};

type SubmissionStatusResponse = {
  submission?: {
    status?: SubmissionStatus;
    updatedAt?: string;
  };
};

const defaultPollMs = 2_500;

export function SubmissionStatusAutoRefresh({
  initialStatus,
  initialUpdatedAt,
  pollMs = defaultPollMs,
  submissionId
}: SubmissionStatusAutoRefreshProps): React.JSX.Element | null {
  const router = useRouter();
  const lastSeen = useRef({
    status: initialStatus,
    updatedAt: initialUpdatedAt
  });

  useEffect(() => {
    if (!shouldPollSubmissionStatus(lastSeen.current.status)) {
      return;
    }

    let cancelled = false;

    const interval = window.setInterval(async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      const response = await fetch(`/api/submissions/${submissionId}`, {
        cache: "no-store"
      }).catch(() => null);

      if (!response?.ok || cancelled) {
        return;
      }

      const body = (await response.json().catch(() => null)) as
        | SubmissionStatusResponse
        | null;
      const nextStatus = body?.submission?.status;
      const nextUpdatedAt = body?.submission?.updatedAt;

      if (!nextStatus || !nextUpdatedAt) {
        return;
      }

      const changed =
        nextStatus !== lastSeen.current.status ||
        nextUpdatedAt !== lastSeen.current.updatedAt;

      if (!changed) {
        return;
      }

      lastSeen.current = {
        status: nextStatus,
        updatedAt: nextUpdatedAt
      };
      router.refresh();

      if (!shouldPollSubmissionStatus(nextStatus)) {
        window.clearInterval(interval);
      }
    }, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pollMs, router, submissionId]);

  return null;
}

export function shouldPollSubmissionStatus(status: SubmissionStatus): boolean {
  return status === "SCAN_QUEUED" || status === "SCANNING";
}

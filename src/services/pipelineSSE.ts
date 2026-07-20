import EventSource from "react-native-sse";
import { BASE_URL } from "@/config";
import { getAccessToken } from "./auth";

export interface PipelineEvent {
  mediaId: string;
  status: string;
  contentId?: string;
  isDuplicate?: boolean;
  violationsCount?: number;
  isSafe?: boolean;
  primaryLabel?: string;
  errorMessage?: string;
  failedStep?: string;
}

export interface PipelineSSEHandlers {
  onCopyrightComplete?: (data: PipelineEvent) => void;
  onModerationComplete?: (data: PipelineEvent) => void;
  onFailed?: (data: PipelineEvent) => void;
  onError?: (error: any) => void;
}

/**
 * Connects to the SSE endpoint /api/v1/sse/pipeline/connect
 * and listens for real-time pipeline events from the backend.
 */
export async function connectPipelineSSE(
  handlers: PipelineSSEHandlers
): Promise<{ close: () => void }> {
  const token = await getAccessToken();
  const url = `${BASE_URL}/api/v1/sse/pipeline/connect`;

  const es = new EventSource<
    "pipeline:copyright_complete" | "pipeline:moderation_complete" | "pipeline:failed" | "heartbeat" | "connected"
  >(url, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  es.addEventListener("pipeline:copyright_complete", (event) => {
    if (event.data) {
      try {
        const data: PipelineEvent = JSON.parse(event.data);
        handlers.onCopyrightComplete?.(data);
      } catch (err) {
        console.error("[SSE] Failed to parse copyright event", err);
      }
    }
  });

  es.addEventListener("pipeline:moderation_complete", (event) => {
    if (event.data) {
      try {
        const data: PipelineEvent = JSON.parse(event.data);
        handlers.onModerationComplete?.(data);
      } catch (err) {
        console.error("[SSE] Failed to parse moderation event", err);
      }
    }
  });

  es.addEventListener("pipeline:failed", (event) => {
    if (event.data) {
      try {
        const data: PipelineEvent = JSON.parse(event.data);
        handlers.onFailed?.(data);
      } catch (err) {
        console.error("[SSE] Failed to parse pipeline:failed event", err);
      }
    }
  });

  es.addEventListener("error", (event) => {
    handlers.onError?.(event);
  });

  return {
    close: () => {
      es.close();
    },
  };
}

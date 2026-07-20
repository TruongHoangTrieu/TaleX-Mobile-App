import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

export async function shareEpisode(episodeId: string): Promise<any> {
  const url = apiUrl("/api/v1/episodes/shares");
  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify({ episodeId }),
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Failed to record episode share: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch (e) {}
    throw new Error(msg);
  }

  return res.json();
}

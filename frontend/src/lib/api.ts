const API_BASE = (import.meta.env.VITE_API_BASE as string) || "https://potholewatch-607032555709.us-central1.run.app";
const API_KEY = (import.meta.env.VITE_API_KEY as string) || "622e7c0f04002fc48855aa8d74b3c04311f5893c976fcb97";

export interface Report {
  id: number;
  source_filename: string;
  pothole_count: number;
  severity: string;
  confidence: number;
  coverage_pct: number;
  location: string | null;
  status: string;
  created_at: string;
}

export interface DashboardSummary {
  total_reports: number;
  total_potholes: number;
  severe_count: number;
  avg_confidence: number;
}

function authHeaders(): HeadersInit {
  return { "X-API-Key": API_KEY };
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export const api = {
  health: () => fetch(`${API_BASE}/api/health`).then((r) => json<{ status: string }>(r)),
  summary: () =>
    fetch(`${API_BASE}/api/dashboard/summary`, { headers: authHeaders() }).then((r) => json<DashboardSummary>(r)),
  reports: () => fetch(`${API_BASE}/api/reports`, { headers: authHeaders() }).then((r) => json<Report[]>(r)),
  exportEvents: () => downloadFile(`${API_BASE}/api/reports/export`, "potholewatch_reports.csv"),
  runDemo: () =>
    fetch(`${API_BASE}/api/analyze/demo`, { method: "POST", headers: authHeaders() }).then((r) => json<Report>(r)),
  analyzeImage: (file: File, location: string) => {
    const form = new FormData();
    form.set("file", file);
    if (location) form.set("location", location);
    return fetch(`${API_BASE}/api/analyze`, { method: "POST", headers: authHeaders(), body: form }).then((r) =>
      json<Report>(r)
    );
  },
};

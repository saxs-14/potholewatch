const API_BASE = "";

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

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export const api = {
  health: () => fetch(`${API_BASE}/api/health`).then((r) => json<{ status: string }>(r)),
  summary: () => fetch(`${API_BASE}/api/dashboard/summary`).then((r) => json<DashboardSummary>(r)),
  reports: () => fetch(`${API_BASE}/api/reports`).then((r) => json<Report[]>(r)),
  exportCsvUrl: () => `${API_BASE}/api/reports/export`,
  runDemo: () => fetch(`${API_BASE}/api/analyze/demo`, { method: "POST" }).then((r) => json<Report>(r)),
  analyzeImage: (file: File, location: string) => {
    const form = new FormData();
    form.set("file", file);
    if (location) form.set("location", location);
    return fetch(`${API_BASE}/api/analyze`, { method: "POST", body: form }).then((r) => json<Report>(r));
  },
};

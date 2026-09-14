import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, DashboardSummary, Report } from "../lib/api";
import KpiCard from "../components/KpiCard";

const SEVERITY_COLOR: Record<string, string> = {
  none: "text-slate-400",
  minor: "text-emerald-400",
  moderate: "text-amber-400",
  severe: "text-red-500",
};

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.summary(), api.reports()]);
      setSummary(s);
      setReports(r);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    api.health().then(() => setApiOnline(true)).catch(() => setApiOnline(false));
    refresh();
  }, [refresh]);

  const runDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.runDemo();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const runUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await api.analyzeImage(file, location);
      setFile(null);
      setLocation("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
          PotholeWatch
        </Link>
        <span className="flex items-center gap-2 text-xs">
          <span className={`inline-block h-2 w-2 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-red-500"}`} />
          {apiOnline === null ? "Checking..." : apiOnline ? "Backend online" : "Backend offline"}
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {!apiOnline && apiOnline !== null && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">
            Can't reach the backend at <code>/api</code>. Start it with <code>uvicorn app.main:app --reload</code>.
          </div>
        )}

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-semibold mb-4">Report a road</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200"
            />
            <input
              placeholder="Location (optional, e.g. 5th Ave & Main St)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm flex-1 min-w-[200px]"
            />
            <button
              disabled={!file || loading}
              onClick={runUpload}
              className="rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 transition px-4 py-2 text-sm font-medium"
            >
              {loading ? "Analyzing..." : "Analyze photo"}
            </button>
            <span className="text-slate-500 text-sm">or</span>
            <button
              disabled={loading}
              onClick={runDemo}
              className="rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-40 transition px-4 py-2 text-sm font-medium"
            >
              {loading ? "Running..." : "Run demo sample"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total reports" value={summary?.total_reports ?? "-"} />
          <KpiCard label="Potholes found" value={summary?.total_potholes ?? "-"} />
          <KpiCard label="Severe reports" value={summary?.severe_count ?? "-"} accent="alert" />
          <KpiCard label="Avg. confidence" value={summary ? summary.avg_confidence : "-"} />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Reports</h2>
            <a href={api.exportCsvUrl()} className="text-sm rounded-lg border border-slate-700 hover:border-slate-500 transition px-3 py-1.5">
              Export CSV
            </a>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No reports yet — run the demo or upload a photo above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-4">File</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Potholes</th>
                  <th className="py-2 pr-4">Severity</th>
                  <th className="py-2 pr-4">Confidence</th>
                  <th className="py-2 pr-4">Reported</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/60">
                    <td className="py-2 pr-4">{r.source_filename}</td>
                    <td className="py-2 pr-4">{r.location ?? "—"}</td>
                    <td className="py-2 pr-4">{r.pothole_count}</td>
                    <td className={`py-2 pr-4 capitalize ${SEVERITY_COLOR[r.severity] ?? ""}`}>{r.severity}</td>
                    <td className="py-2 pr-4">{r.confidence}</td>
                    <td className="py-2 pr-4 text-slate-500">{new Date(r.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

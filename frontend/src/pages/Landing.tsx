import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://potholewatch-saxs-14s-projects.vercel.app";
const TITLE = "PotholeWatch — Road Damage Reporting & Maintenance";
const DESCRIPTION = "Capture road damage, attach GPS evidence, receive AI-assisted analysis and track reports from submission through repair.";

const FEATURES = [
  ["Photo reporting", "Capture a road image from a phone or upload one."],
  ["GPS evidence", "Attach browser GPS coordinates when available."],
  ["AI-assisted analysis", "Estimate damage count, coverage and severity for human review."],
  ["Workflow tracking", "Move reports from reported through reviewed, scheduled and fixed."],
  ["Evidence & history", "Keep the original image and a status history for each report."],
  ["Open data export", "Export CSV for planning and further analysis."],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={SITE_URL + "/"} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={SITE_URL + "/"} />
        <meta property="og:image" content={SITE_URL + "/og-image.png"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={SITE_URL + "/og-image.png"} />
      </Helmet>

      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-semibold text-lg"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />PotholeWatch</div>
        <Link to="/app" className="rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-sm font-medium">Open application</Link>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-16 text-center">
          <p className="text-orange-400 text-sm font-medium">ROAD DAMAGE REPORTING PLATFORM</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">Turn road evidence into <span className="text-orange-400">maintenance work</span></h1>
          <p className="mt-5 text-slate-400 max-w-2xl mx-auto text-lg">{DESCRIPTION}</p>
          <div className="mt-8 flex justify-center"><Link to="/app" className="rounded-lg bg-orange-600 hover:bg-orange-500 px-5 py-3 font-medium">Report a road problem</Link></div>
          <p className="mt-4 text-xs text-slate-500">AI is advisory, not a certified road inspection. Reports should be verified before maintenance action.</p>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          {FEATURES.map(([title, desc]) => <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><h2 className="font-semibold">{title}</h2><p className="mt-1.5 text-sm text-slate-400">{desc}</p></div>)}
        </section>

        <section className="py-16 grid sm:grid-cols-2 gap-8">
          <div><h2 className="text-2xl font-bold mb-3">Designed for a real workflow</h2><p className="text-slate-400 text-sm">A report contains evidence, location, status and traceable history instead of only an AI prediction.</p></div>
          <div><h2 className="text-2xl font-bold mb-3">Built for a student budget</h2><p className="text-slate-400 text-sm">Open-source components keep development and local testing accessible without paid services.</p></div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">PotholeWatch — AI-assisted road-condition reporting.</footer>
    </div>
  );
}

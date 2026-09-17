import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://potholewatch-saxs-14s-projects.vercel.app";
const TITLE = "PotholeWatch — AI Road Damage Detection from Photos";
const DESCRIPTION =
  "Upload a road photo and PotholeWatch detects and rates surface damage, building a reportable, exportable record for municipalities and fleets.";

const JSON_LD = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "PotholeWatch", "applicationCategory": "BusinessApplication", "operatingSystem": "Web", "description": "Upload a road photo and PotholeWatch detects and rates surface damage, building a reportable, exportable record for municipalities and fleets.", "url": "https://potholewatch-saxs-14s-projects.vercel.app", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}};

const FEATURES = [
  { title: "Pothole detection", desc: "Finds dark, irregular road-surface defects from photos." },
  { title: "Severity classification", desc: "Buckets each report into minor, moderate or severe." },
  { title: "Manual or GPS location", desc: "Works even without GPS via manual location entry." },
  { title: "Road-condition dashboard", desc: "Live counts, severity breakdown, confidence." },
  { title: "Report status tracking", desc: "Reported → reviewed → scheduled → fixed." },
  { title: "CSV export", desc: "Export reports for municipal planning systems." },
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
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={SITE_URL + "/og-image.png"} />

        <script type="application/ld+json">{JSON.stringify(JSON_LD)}</script>
      </Helmet>

      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
          PotholeWatch
        </div>
        <Link to="/app" className="rounded-lg bg-orange-600 hover:bg-orange-500 transition px-4 py-2 text-sm font-medium">
          Open dashboard
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Turn road photos into <span className="text-orange-400">maintenance data</span>
          </h1>
          <p className="mt-5 text-slate-400 max-w-2xl mx-auto text-lg">
            Upload a road photo and PotholeWatch detects and rates surface damage — building
            a reportable, exportable record for municipalities and fleets.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/app" className="rounded-lg bg-orange-600 hover:bg-orange-500 transition px-5 py-3 font-medium">
              Try the live demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Detection uses classical image analysis, not a trained model — see the README
            "Limitations" before using this for engineering decisions.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          <h2 className="sr-only">Features</h2>
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="py-16 grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">Who it's for</h2>
            <ul className="text-slate-400 space-y-1.5 text-sm">
              <li>Municipalities</li>
              <li>Transport & logistics companies</li>
              <li>Insurance companies</li>
              <li>Road maintenance contractors</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">Pricing model</h2>
            <ul className="text-slate-400 space-y-1.5 text-sm">
              <li>SaaS subscription</li>
              <li>Per-vehicle fleet subscription</li>
              <li>Municipal contracts</li>
              <li>Data/reporting services</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        PotholeWatch — road condition MVP. Classical CV baseline, not a certified inspection tool.
      </footer>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api, DashboardSummary, Report } from "../lib/api";
import KpiCard from "../components/KpiCard";

const STATUSES = ["reported","reviewed","scheduled","fixed","rejected"];

export default function Dashboard() {
  const [summary,setSummary]=useState<DashboardSummary|null>(null);
  const [reports,setReports]=useState<Report[]>([]);
  const [file,setFile]=useState<File|null>(null);
  const [location,setLocation]=useState("");
  const [coords,setCoords]=useState<{latitude:number;longitude:number}|null>(null);
  const [selected,setSelected]=useState<Report|null>(null);
  const [online,setOnline]=useState<boolean|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [orders,setOrders]=useState<any[]>([]);
  const [evidenceUrl,setEvidenceUrl]=useState<string|null>(null);
  const [orderTitle,setOrderTitle]=useState("");
  const [orderTeam,setOrderTeam]=useState("");
  const [orderPriority,setOrderPriority]=useState("normal");
  const navigate=useNavigate();

  const refresh=useCallback(async()=>{try{const [s,r]=await Promise.all([api.summary(),api.reports()]);setSummary(s);setReports(r);setOnline(true);}catch{setOnline(false);}},[]);
  useEffect(()=>{if(!localStorage.getItem("potholewatch_token") && !import.meta.env.VITE_API_KEY){navigate("/login");return;}api.health().then(()=>setOnline(true)).catch(()=>setOnline(false));refresh();},[refresh,navigate]);

  const gps=()=>{if(!navigator.geolocation){setError("GPS is not available in this browser.");return;}navigator.geolocation.getCurrentPosition(p=>{setCoords({latitude:p.coords.latitude,longitude:p.coords.longitude});setLocation("GPS location captured");setError(null);},e=>setError(e.message||"Could not get GPS location."),{enableHighAccuracy:true,timeout:10000,maximumAge:30000});};
  const submit=async()=>{if(!file)return;setLoading(true);setError(null);try{const r=await api.analyzeImage(file,location,coords?.latitude,coords?.longitude);setSelected(r);setFile(null);setLocation("");setCoords(null);await refresh();}catch(e){setError(e instanceof Error?e.message:"Analysis failed");}finally{setLoading(false);}};
  useEffect(()=>{let active=true; if(!selected){setOrders([]);setEvidenceUrl(null);return;} api.workOrders(selected.id).then(setOrders).catch(()=>setOrders([])); if(selected.evidence_path) api.evidenceBlob(selected.evidence_path).then(url=>{if(active)setEvidenceUrl(url);}).catch(()=>setEvidenceUrl(null)); else setEvidenceUrl(null); return ()=>{active=false;};},[selected]);
  const createOrder=async()=>{if(!selected||orderTitle.trim().length<3)return;try{await api.createWorkOrder(selected.id,{title:orderTitle.trim(),assigned_team:orderTeam||undefined,priority:orderPriority});setOrderTitle("");setOrderTeam("");setOrderPriority("normal");setOrders(await api.workOrders(selected.id));}catch(e){setError(e instanceof Error?e.message:"Could not create work order");}};
  const changeStatus=async(id:number,value:string)=>{try{const r=await api.updateStatus(id,value);setSelected(r);await refresh();}catch(e){setError(e instanceof Error?e.message:"Status update failed");}};

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <Helmet><title>Dashboard — PotholeWatch</title><meta name="robots" content="noindex,nofollow"/></Helmet>
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800"><Link to="/" className="font-semibold">● PotholeWatch</Link><div className="flex items-center gap-4"><Link to="/map" className="text-sm text-orange-400">Map</Link><button onClick={()=>{api.logout();window.location.href="/login"}} className="text-sm text-slate-400">Sign out</button><span className="text-xs">{online===null?"Checking…":online?"● Backend online":"● Backend offline"}</span></div></header>
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {!online&&online!==null&&<div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm">Backend unavailable. Start FastAPI locally with <code>uvicorn app.main:app --reload</code>.</div>}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h1 className="text-xl font-bold">Report road damage</h1><p className="text-sm text-slate-400 mt-1">Take a photo, capture GPS when available, and submit it for AI-assisted review.</p>
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 mt-4">
          <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>setFile(e.target.files?.[0]??null)} className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2"/>
          <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Road/location (optional)" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"/>
          <button onClick={gps} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Use my GPS</button>
        </div>
        {coords&&<p className="mt-2 text-xs text-emerald-400">GPS: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</p>}
        <div className="mt-4 flex gap-3"><button disabled={!file||loading} onClick={submit} className="rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 px-4 py-2 text-sm font-medium">{loading?"Analyzing…":"Analyze & submit"}</button><button disabled={loading} onClick={async()=>{setLoading(true);try{const r=await api.runDemo();setSelected(r);await refresh();}catch(e){setError(e instanceof Error?e.message:"Demo failed")}finally{setLoading(false)}}} className="rounded-lg border border-slate-700 px-4 py-2 text-sm">Run demo</button></div>
        {error&&<p className="mt-3 text-sm text-red-400">{error}</p>}<p className="mt-3 text-xs text-slate-500">AI results are advisory. Human verification is required before maintenance decisions.</p>
      </section>
      <section className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4"><KpiCard label="Reports" value={summary?.total_reports??"-"}/><KpiCard label="Potholes" value={summary?.total_potholes??"-"}/><KpiCard label="Severe" value={summary?.severe_count??"-"} accent="alert"/><KpiCard label="Open" value={summary?.open_reports??"-"}/><KpiCard label="Fixed" value={summary?.fixed_reports??"-"}/><KpiCard label="Confidence" value={summary?summary.avg_confidence:"-"}/></section>
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex justify-between mb-4"><h2 className="font-semibold">Reports</h2><button onClick={()=>api.exportEvents()} className="text-sm border border-slate-700 rounded-lg px-3 py-1.5">Export CSV</button></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500 border-b border-slate-800"><th className="py-2">ID</th><th>Location</th><th>Potholes</th><th>Severity</th><th>Status</th><th>Confidence</th></tr></thead><tbody>{reports.map(r=><tr key={r.id} onClick={()=>setSelected(r)} className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer"><td className="py-2 font-mono">PW-{String(r.id).padStart(6,"0")}</td><td>{r.location??"—"}{r.latitude!=null&&<div className="text-xs text-slate-500">{r.latitude.toFixed(5)}, {r.longitude?.toFixed(5)}</div>}</td><td>{r.pothole_count}</td><td className="capitalize">{r.severity}</td><td className="capitalize">{r.status}</td><td>{Math.round(r.confidence*100)}%</td></tr>)}</tbody></table></div>
      </section>
      {selected&&<section className="rounded-xl border border-slate-700 bg-slate-900 p-5"><div className="flex justify-between"><div><h2 className="font-semibold">Report PW-{String(selected.id).padStart(6,"0")}</h2><p className="text-sm text-slate-400">{selected.source_filename}</p></div><button onClick={()=>setSelected(null)}>Close</button></div><div className="grid md:grid-cols-2 gap-5 mt-5"><div>{selected.evidence_path&&evidenceUrl&&<img src={evidenceUrl} alt="Road evidence" className="w-full max-h-80 object-contain rounded-lg bg-slate-950"/>}{selected.latitude!=null&&selected.longitude!=null&&<a target="_blank" rel="noreferrer" className="inline-block mt-3 text-sm text-orange-400" href={"https://www.openstreetmap.org/?mlat="+selected.latitude+"&mlon="+selected.longitude+"#map=18/"+selected.latitude+"/"+selected.longitude}>Open GPS position in OpenStreetMap</a>}</div><div className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-500">Severity</span><div className="capitalize">{selected.severity}</div></div><div><span className="text-slate-500">Confidence</span><div>{Math.round(selected.confidence*100)}%</div></div><div><span className="text-slate-500">Coverage</span><div>{selected.coverage_pct}%</div></div><div><span className="text-slate-500">Status</span><div className="capitalize">{selected.status}</div></div></div><div><p className="text-sm text-slate-500 mb-2">Workflow status</p><div className="flex flex-wrap gap-2">{STATUSES.map(s=><button key={s} disabled={selected.status===s} onClick={()=>changeStatus(selected.id,s)} className="border border-slate-700 rounded-md px-3 py-1.5 text-xs capitalize disabled:opacity-40">{s}</button>)}</div></div><div className="mt-5 border-t border-slate-800 pt-5"><p className="text-sm text-slate-500 mb-2">Create maintenance work order</p><div className="grid sm:grid-cols-3 gap-2"><input value={orderTitle} onChange={e=>setOrderTitle(e.target.value)} placeholder="Work required" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"/><input value={orderTeam} onChange={e=>setOrderTeam(e.target.value)} placeholder="Maintenance team" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"/><select value={orderPriority} onChange={e=>setOrderPriority(e.target.value)} className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm"><option>low</option><option>normal</option><option>high</option><option>urgent</option></select></div><button onClick={createOrder} disabled={orderTitle.trim().length<3} className="mt-2 rounded-lg bg-orange-600 disabled:opacity-40 px-3 py-2 text-sm">Create work order</button>{orders.length>0&&<div className="mt-3 space-y-2">{orders.map(o=><div key={o.id} className="rounded-lg border border-slate-800 p-3 text-sm"><b>{o.title}</b><span className="ml-2 text-slate-400">{o.assigned_team||"Unassigned"} · {o.priority} · {o.status}</span></div>)}</div>}</div></div></div></section>}
    </main>
  </div>;
}

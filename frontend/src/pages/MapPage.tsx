import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, Report } from "../lib/api";

export default function MapPage() {
  const ref=useRef<HTMLDivElement>(null);
  const [reports,setReports]=useState<Report[]>([]);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{api.reports().then(setReports).catch(e=>setError(e instanceof Error?e.message:"Could not load reports"));},[]);

  useEffect(()=>{
    if(!ref.current)return;
    const id="leaflet-css";
    if(!document.getElementById(id)){const link=document.createElement("link");link.id=id;link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(link);}
    const load=()=>{
      const L=(window as any).L;
      if(!L||!ref.current)return;
      const map=L.map(ref.current).setView([-26.2041,28.0473],11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
      const located=reports.filter(r=>r.latitude!=null&&r.longitude!=null);
      located.forEach(r=>L.marker([r.latitude,r.longitude]).addTo(map).bindPopup("<b>PW-"+String(r.id).padStart(6,"0")+"</b><br>"+r.severity+" · "+r.status));
      if(located.length){const bounds=L.latLngBounds(located.map(r=>[r.latitude,r.longitude]));map.fitBounds(bounds,{padding:[30,30],maxZoom:15});}
      return map;
    };
    if((window as any).L){const map=load();return()=>{if(map)map.remove();};}
    const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.onload=load;document.body.appendChild(script);
    return()=>{script.remove();};
  },[reports]);

  return <div className="min-h-screen bg-slate-950 text-slate-100"><header className="border-b border-slate-800 px-6 py-4"><div className="max-w-6xl mx-auto flex justify-between"><Link to="/app" className="font-semibold">← PotholeWatch</Link><span className="text-sm">Road damage map</span></div></header><main className="max-w-6xl mx-auto px-6 py-6"><h1 className="text-2xl font-bold">Reported road damage</h1><p className="text-sm text-slate-400 mt-1">Markers are based on reports that contain GPS coordinates.</p>{error&&<p className="text-red-400 text-sm mt-3">{error}</p>}<div ref={ref} className="mt-5 h-[65vh] rounded-xl overflow-hidden border border-slate-800" /><p className="text-xs text-slate-500 mt-3">Map data © OpenStreetMap contributors. AI classifications are advisory.</p></main></div>;
}

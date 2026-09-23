const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "/api";
const API_KEY = (import.meta.env.VITE_API_KEY as string | undefined) || "";

export interface Report {
  id:number; source_filename:string; pothole_count:number; severity:string; confidence:number; coverage_pct:number;
  location:string|null; latitude:number|null; longitude:number|null; status:string; evidence_path:string|null; created_at:string;
}
export interface DashboardSummary { total_reports:number; total_potholes:number; severe_count:number; avg_confidence:number; open_reports:number; fixed_reports:number; }
export interface AuthUser { id:number; email:string; role:string; }

const storedToken=()=>localStorage.getItem("potholewatch_token");
function authHeaders():HeadersInit {
  const token=storedToken();
  if(token) return {Authorization:`Bearer ${token}`};
  return API_KEY ? {"X-API-Key":API_KEY} : {};
}
async function json<T>(res:Response):Promise<T>{
  if(!res.ok){let message=res.statusText;try{const b=await res.json();message=b.detail||message;}catch{}throw new Error(message||"Request failed");}
  return res.json();
}
async function downloadFile(url:string,filename:string){
  const res=await fetch(url,{headers:authHeaders()}); if(!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
  const blob=await res.blob(), objectUrl=URL.createObjectURL(blob), a=document.createElement("a"); a.href=objectUrl;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(objectUrl);
}
export const api={
  register:async(email:string,password:string)=>{const r=await fetch(`${API_BASE}/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const v=await json<{access_token:string;user:AuthUser}>(r);localStorage.setItem("potholewatch_token",v.access_token);return v;},
  login:async(email:string,password:string)=>{const r=await fetch(`${API_BASE}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const v=await json<{access_token:string;user:AuthUser}>(r);localStorage.setItem("potholewatch_token",v.access_token);return v;},
  logout:()=>localStorage.removeItem("potholewatch_token"),
  health:()=>fetch(`${API_BASE}/health`).then(r=>json<{status:string}>(r)),
  summary:()=>fetch(`${API_BASE}/dashboard/summary`,{headers:authHeaders()}).then(r=>json<DashboardSummary>(r)),
  reports:()=>fetch(`${API_BASE}/reports`,{headers:authHeaders()}).then(r=>json<Report[]>(r)),
  report:(id:number)=>fetch(`${API_BASE}/reports/${id}`,{headers:authHeaders()}).then(r=>json<Report>(r)),
  history:(id:number)=>fetch(`${API_BASE}/reports/${id}/history`,{headers:authHeaders()}).then(r=>json(r)),
  updateStatus:(id:number,status:string,note?:string)=>fetch(`${API_BASE}/reports/${id}/status`,{method:"PATCH",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify({status,note})}).then(r=>json<Report>(r)),
  workOrders:async(id:number)=>{const r=await fetch(`${API_BASE}/reports/${id}/work-orders`,{headers:authHeaders()});return json<Array<{id:number;report_id:number;title:string;assigned_team:string|null;priority:string;scheduled_date:string|null;notes:string|null;status:string;created_at:string}>>(r);},
  createWorkOrder:async(id:number,data:object)=>{const r=await fetch(`${API_BASE}/reports/${id}/work-orders`,{method:"POST",headers:{...authHeaders(),"Content-Type":"application/json"},body:JSON.stringify(data)});return json(r);},
  exportEvents:()=>downloadFile(`${API_BASE}/reports/export`,"potholewatch_reports.csv"),
  runDemo:()=>fetch(`${API_BASE}/analyze/demo`,{method:"POST",headers:authHeaders()}).then(r=>json<Report>(r)),
  analyzeImage:(file:File,location:string,latitude?:number,longitude?:number)=>{const form=new FormData();form.set("file",file);if(location)form.set("location",location);if(latitude!==undefined)form.set("latitude",String(latitude));if(longitude!==undefined)form.set("longitude",String(longitude));return fetch(`${API_BASE}/analyze`,{method:"POST",headers:authHeaders(),body:form}).then(r=>json<Report>(r));},
  evidenceBlob:async(path:string)=>{const r=await fetch(`${API_BASE}/evidence/${encodeURIComponent(path)}`,{headers:authHeaders()});if(!r.ok)throw new Error("Evidence unavailable");return URL.createObjectURL(await r.blob());},
};

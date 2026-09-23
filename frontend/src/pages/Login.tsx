import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [register,setRegister]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const navigate=useNavigate();
  const submit=async(e:FormEvent)=>{e.preventDefault();setLoading(true);setError(null);try{if(register)await api.register(email,password);else await api.login(email,password);navigate("/app");}catch(err){setError(err instanceof Error?err.message:"Authentication failed");}finally{setLoading(false);}};
  return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6"><div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7"><Link to="/" className="text-sm text-orange-400">← PotholeWatch</Link><h1 className="text-2xl font-bold mt-5">{register?"Create account":"Sign in"}</h1><p className="text-sm text-slate-400 mt-1">Use an account to access road reports.</p><form onSubmit={submit} className="space-y-4 mt-6"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"/><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"/>{error&&<p className="text-sm text-red-400">{error}</p>}<button disabled={loading} className="w-full rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-40 px-4 py-2 font-medium">{loading?"Please wait…":register?"Create account":"Sign in"}</button></form><button onClick={()=>{setRegister(!register);setError(null)}} className="mt-5 text-sm text-slate-400 hover:text-white">{register?"Already have an account? Sign in":"New here? Create an account"}</button></div></div>;
}

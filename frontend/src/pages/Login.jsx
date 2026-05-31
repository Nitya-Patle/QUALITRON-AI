import { useState } from "react";
import { C } from "../theme";
import { useAuth } from "../App";
import { authAPI } from "../utils/api";

export default function Login() {
  const { login } = useAuth();
  const [tab, setTab]       = useState("login");
  const [form, setForm]     = useState({name:"",email:"",password:"",role:"Employee"});
  const [error, setError]   = useState("");
  const [loading,setLoading]= useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (tab === "login") {
        const d = await authAPI.login(form.email, form.password);
        login(d.token, d.user);
      } else {
        await authAPI.register(form.name, form.email, form.password, form.role);
        setTab("login"); setError("Registered! Please login.");
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const inp = { width:"100%",padding:"12px 14px",borderRadius:10,border:`1px solid ${C.border}`,
    background:C.card,color:C.text,fontSize:14,outline:"none",marginBottom:12 };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:400,background:C.panel,borderRadius:20,padding:40,border:`1px solid ${C.border}`}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:11,color:C.accent,letterSpacing:4,fontWeight:700}}>QUALITRON AI</div>
          <div style={{fontSize:26,fontWeight:900,color:C.text,marginTop:4}}>Quality Control System</div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:24}}>
          {["login","register"].map(t=>(
            <div key={t} onClick={()=>setTab(t)} style={{flex:1,textAlign:"center",padding:"10px",
              borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,
              background:tab===t?`${C.accent}22`:"transparent",
              color:tab===t?C.accent:C.muted,border:`1px solid ${tab===t?C.accent:C.border}`}}>
              {t==="login"?"Login":"Register"}
            </div>
          ))}
        </div>
        {tab==="register" && <input placeholder="Full Name" style={inp} value={form.name} onChange={e=>set("name",e.target.value)}/>}
        <input placeholder="Email" style={inp} value={form.email} onChange={e=>set("email",e.target.value)}/>
        <input placeholder="Password" type="password" style={inp} value={form.password} onChange={e=>set("password",e.target.value)}/>
        {tab==="register" && (
          <select style={{...inp,marginBottom:16}} value={form.role} onChange={e=>set("role",e.target.value)}>
            {["Admin","Manager","Employee"].map(r=><option key={r}>{r}</option>)}
          </select>
        )}
        {error && <div style={{color:C.red,fontSize:12,marginBottom:12,padding:"8px 12px",background:`${C.red}15`,borderRadius:8}}>{error}</div>}
        <button onClick={submit} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:10,border:"none",
          background:`linear-gradient(135deg,${C.accent},#7c3aed)`,color:"#fff",
          fontWeight:800,fontSize:15,cursor:loading?"not-allowed":"pointer"}}>
          {loading?"Loading...":(tab==="login"?"Login":"Register")}
        </button>
        <div style={{marginTop:16,fontSize:11,color:C.muted,textAlign:"center"}}>
          Demo: admin@qualitron.ai / password123
        </div>
      </div>
    </div>
  );
}

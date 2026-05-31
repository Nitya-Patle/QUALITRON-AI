import { useState, useEffect } from "react";
import { C } from "../theme";

const NAV_LABELS = {dashboard:"Dashboard",inspect:"AI Inspection",camera:"Live Monitor",
  analytics:"Analytics",records:"Records",alerts:"Alerts",reports:"Reports",settings:"Settings"};

export default function Topbar({ page, dark, setDark, user, logout, alerts }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => { const t = setInterval(()=>setTime(new Date().toLocaleTimeString()),1000); return ()=>clearInterval(t); },[]);
  return (
    <div style={{height:60,background:C.panel,borderBottom:`1px solid ${C.border}`,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"0 28px",position:"sticky",top:0,zIndex:90}}>
      <div style={{fontWeight:800,fontSize:16,color:C.text}}>{NAV_LABELS[page]}</div>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.green,
            boxShadow:`0 0 6px ${C.green}`,animation:"pulse 1.5s infinite"}}/>
          <span style={{fontSize:11,color:C.green,fontWeight:700}}>LIVE</span>
        </div>
        <div style={{fontSize:12,color:C.muted,fontFamily:"monospace"}}>{time}</div>
        {alerts > 0 && (
          <div style={{background:C.red,borderRadius:"50%",width:22,height:22,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800,color:"#fff"}}>{alerts}</div>
        )}
        <div onClick={()=>setDark(!dark)} style={{cursor:"pointer",fontSize:18}}>{dark?"☀️":"🌙"}</div>
        <div onClick={logout} style={{cursor:"pointer",fontSize:12,color:C.muted,
          padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`}}>Logout</div>
      </div>
    </div>
  );
}

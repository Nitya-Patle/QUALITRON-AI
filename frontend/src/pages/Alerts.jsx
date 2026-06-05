import { useState, useEffect } from "react";
import { C } from "../theme";
import { alertsAPI } from "../utils/api";
import SectionTitle from "../components/SectionTitle";

const TYPE_COLOR = {CRITICAL:C.red,WARNING:C.yellow,INFO:C.accent,SUCCESS:C.green,IOT_ANOMALY:C.purple};
const DEMO_ALERTS = [
  {_id:"1",type:"CRITICAL",message:"3 consecutive defective units on Line B — immediate action required",timestamp:new Date(Date.now()-120000).toISOString(),resolved:false,icon:"🚨"},
  {_id:"2",type:"WARNING", message:"Defect rate exceeded 10% threshold on Station A",timestamp:new Date(Date.now()-900000).toISOString(),resolved:false,icon:"⚠️"},
  {_id:"3",type:"INFO",    message:"Email alert sent to quality-team@factory.com",timestamp:new Date(Date.now()-900000).toISOString(),resolved:true,icon:"📧"},
  {_id:"4",type:"WARNING", message:"Conveyor Belt A vibration anomaly detected: 1.3g (normal 0-1.0g)",timestamp:new Date(Date.now()-3600000).toISOString(),resolved:false,icon:"⚡"},
  {_id:"5",type:"INFO",    message:"SMS alert sent to +91-98XXXXXXXX",timestamp:new Date(Date.now()-3600000).toISOString(),resolved:true,icon:"📱"},
  {_id:"6",type:"SUCCESS", message:"Quality target met — Line A passed 200 units consecutively",timestamp:new Date(Date.now()-7200000).toISOString(),resolved:true,icon:"✅"},
];

export default function Alerts() {
  const [alerts,setAlerts] = useState(DEMO_ALERTS);
  const [cfg,   setCfg]    = useState({email:true,sms:true,whatsapp:false,slack:false});

  useEffect(()=>{
    alertsAPI.list().then(d=>{ if(d.alerts?.length) setAlerts(d.alerts); }).catch(()=>{});
  },[]);

  const resolve = async (id) => {
    try { await alertsAPI.resolve(id); } catch {}
    setAlerts(prev=>prev.map(a=>a._id===id?{...a,resolved:true}:a));
  };

  const counts = {CRITICAL:0,WARNING:0,INFO:0,resolved:0};
  alerts.forEach(a=>{ if(a.resolved) counts.resolved++; else counts[a.type]=(counts[a.type]||0)+1; });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[["Critical",counts.CRITICAL||1,C.red,"🚨"],["Warnings",counts.WARNING||2,C.yellow,"⚠️"],
          ["Info",counts.INFO||2,C.accent,"ℹ️"],["Resolved",counts.resolved||18,C.green,"✅"]].map(([l,v,c,icon],i)=>(
          <div key={i} style={{background:`${C.card}`,borderRadius:12,padding:16,border:`1px solid ${c}44`,textAlign:"center"}}>
            <div style={{fontSize:24}}>{icon}</div>
            <div style={{fontSize:26,fontWeight:900,color:c,marginTop:4}}>{v}</div>
            <div style={{fontSize:11,color:C.muted}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{background:`${C.card}`,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
        <SectionTitle>Alert Feed</SectionTitle>
        {alerts.map(a=>{
          const color = TYPE_COLOR[a.type]||C.accent;
          const time  = new Date(a.timestamp).toLocaleString();
          return (
            <div key={a._id} style={{display:"flex",alignItems:"flex-start",gap:14,padding:14,
              borderRadius:10,marginBottom:8,opacity:a.resolved?0.5:1,
              background:`${color}0a`,border:`1px solid ${color}33`}}>
              <span style={{fontSize:20}}>{a.icon||"🔔"}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:800,color,letterSpacing:1}}>{a.type}</span>
                  <span style={{fontSize:11,color:C.muted}}>{time}</span>
                </div>
                <div style={{color:C.text,fontSize:13,marginTop:2}}>{a.message}</div>
              </div>
              {!a.resolved && (
                <button onClick={()=>resolve(a._id)} style={{padding:"4px 10px",borderRadius:6,
                  border:`1px solid ${C.green}`,background:"transparent",color:C.green,
                  fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>✓ Resolve</button>
              )}
            </div>
          );
        })}
      </div>

      <div style={{background:`${C.card}`,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
        <SectionTitle>Notification Configuration</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["Email Notifications","quality-team@factory.com","email"],
            ["SMS Alerts","+91-98XXXXXXXX","sms"],
            ["WhatsApp Bot","Not configured","whatsapp"],
            ["Slack Integration","#quality-alerts","slack"]].map(([label,target,key])=>(
            <div key={key} style={{background:`${C.bg}`,borderRadius:10,padding:14,
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontWeight:700,color:C.text,fontSize:13}}>{label}</div>
                <div style={{fontSize:11,color:C.muted}}>{target}</div>
              </div>
              <div onClick={()=>setCfg(c=>({...c,[key]:!c[key]}))}
                style={{width:44,height:24,borderRadius:12,cursor:"pointer",position:"relative",
                  background:cfg[key]?C.green:`${C.border}`,transition:"background 0.2s"}}>
                <div style={{position:"absolute",top:3,left:cfg[key]?22:3,width:18,height:18,
                  borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

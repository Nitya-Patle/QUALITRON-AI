import { useState } from "react";
import { C } from "../theme";
import { useAuth } from "../App";
import { dashboardAPI } from "../utils/api";
import SectionTitle from "../components/SectionTitle";

export default function Settings() {
  const { user } = useAuth();
  const [role, setRole]     = useState(user?.role || "Admin");
  const [model, setModel]   = useState("Hybrid (Gemini + YOLO)");
  const [conf,  setConf]    = useState(0.75);
  const [saved, setSaved]   = useState(false);

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:`${C.card}`,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SectionTitle>Role-Based Access Control</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[["Admin","👑","Full system access — all features"],
            ["Manager","📋","Reports, analytics, view records"],
            ["Employee","👷","View & run inspections only"]].map(([r,icon,desc])=>(
            <div key={r} onClick={()=>setRole(r)} style={{padding:20,borderRadius:12,cursor:"pointer",
              textAlign:"center",transition:"all 0.2s",
              border:`2px solid ${role===r?C.accent:`${C.border}`}`,
              background:role===r?`${C.accent}15`:`${C.bg}`}}>
              <div style={{fontSize:36,marginBottom:8}}>{icon}</div>
              <div style={{fontWeight:800,color:role===r?C.accent:C.text,fontSize:15}}>{r}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{background:`${C.card}`,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
          <SectionTitle>AI Model Configuration</SectionTitle>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:6}}>Model Version</label>
            <select value={model} onChange={e=>setModel(e.target.value)} style={{width:"100%",padding:"10px 12px",
              borderRadius:8,background:`${C.bg}`,border:`1px solid ${C.border}`,color:C.text,fontSize:13,outline:"none"}}>
              {["Hybrid (Gemini + YOLO)","YOLOv8n (Nano)","YOLOv8s (Small)","YOLOv8m (Medium)","YOLOv8l (Large)","YOLOv8x (Extra Large)"].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <label style={{fontSize:12,color:C.muted}}>Confidence Threshold</label>
              <span style={{fontSize:12,color:C.accent,fontWeight:700}}>{conf}</span>
            </div>
            <input type="range" min="0.5" max="0.95" step="0.05" value={conf}
              onChange={e=>setConf(parseFloat(e.target.value))}
              style={{width:"100%",accentColor:C.accent}}/>
          </div>
          {[["Input Resolution","640 × 640"],["Device","CUDA:0 (GPU)"],["Batch Size","16"],["NMS IoU","0.45"]].map(([k,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",
              borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.accent,fontWeight:700,fontSize:13,fontFamily:"monospace"}}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{background:`${C.card}`,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
          <SectionTitle>System Information</SectionTitle>
          {[["Backend","Flask 3.0 (Python 3.11)"],["Frontend","React 18 + Recharts"],
            ["Database","MongoDB Atlas"],["AI Model","Gemini VLM + YOLOv8"],
            ["Camera","OpenCV VideoCapture"],["Reports","ReportLab + openpyxl"],
            ["Alerts","SMTP + Twilio SMS"],["IoT","MQTT (paho)"]].map(([k,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",
              borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.green,fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:`${C.card}`,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SectionTitle>Account Settings</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {[["Full Name",user?.name||"Nitya"],["Email",user?.email||"nitya@qualitron.ai"],
            ["Role",user?.role||"Admin"],["Department","Quality Control"]].map(([l,v],i)=>(
            <div key={i}>
              <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:4}}>{l}</label>
              <input defaultValue={v} style={{width:"100%",padding:"10px 12px",borderRadius:8,
                background:`${C.bg}`,border:`1px solid ${C.border}`,color:C.text,fontSize:13,outline:"none"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16,marginTop:16}}>
          <button onClick={save} style={{flex:1,padding:"12px 28px",borderRadius:10,
            border:"none",background:`linear-gradient(135deg,${C.accent},#7c3aed)`,
            color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}}>
            {saved?"✅ Saved!":"💾 Save Settings"}
          </button>
          <button onClick={async () => {
            if(window.confirm("WARNING: This will permanently delete ALL inspection records and alerts. Are you sure you want to factory reset?")) {
              try {
                await dashboardAPI.resetSystem();
                alert("System has been factory reset. All test data wiped.");
                window.location.reload();
              } catch(e) { alert("Failed to reset: " + e.message); }
            }
          }} style={{padding:"12px 28px",borderRadius:10,
            border:`1px solid ${C.red}`,background:`${C.red}15`,
            color:C.red,fontWeight:800,fontSize:14,cursor:"pointer"}}>
            🧹 Wipe Database
          </button>
        </div>
      </div>
    </div>
  );
}

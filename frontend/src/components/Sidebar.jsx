import { C } from "../theme";

const NAV = [
  {id:"dashboard", icon:"⬡", label:"Dashboard"},
  {id:"inspect",   icon:"🔬", label:"AI Inspection"},
  {id:"camera",    icon:"📷", label:"Live Monitor"},
  {id:"analytics", icon:"📊", label:"Analytics"},
  {id:"records",   icon:"🗃️",  label:"Records"},
  {id:"alerts",    icon:"🔔", label:"Alerts"},
  {id:"reports",   icon:"📋", label:"Reports"},
  {id:"settings",  icon:"⚙️", label:"Settings"},
];

export default function Sidebar({ active, setActive, role }) {
  return (
    <div style={{width:220,minHeight:"100vh",background:C.panel,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,zIndex:100}}>
      <div style={{padding:"24px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.accent,letterSpacing:3,fontWeight:700}}>QUALITRON AI</div>
        <div style={{fontSize:20,fontWeight:900,color:C.text,letterSpacing:1}}>QC SYSTEM</div>
        <div style={{marginTop:8,padding:"3px 8px",borderRadius:6,display:"inline-block",fontSize:10,fontWeight:700,
          letterSpacing:1,background:role==="Admin"?"#7c3aed22":"#00ff8822",
          border:`1px solid ${role==="Admin"?"#7c3aed":"#00ff88"}`,
          color:role==="Admin"?"#7c3aed":"#00ff88"}}>{role}</div>
      </div>
      <nav style={{flex:1,padding:"12px 12px"}}>
        {NAV.map(n => (
          <div key={n.id} onClick={() => setActive(n.id)} style={{
            display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,
            marginBottom:4,cursor:"pointer",transition:"all 0.15s",fontSize:13,
            background:active===n.id?`${C.accent}18`:"transparent",
            borderLeft:active===n.id?`3px solid ${C.accent}`:"3px solid transparent",
            color:active===n.id?C.accent:C.muted,
            fontWeight:active===n.id?700:400}}>
            <span style={{fontSize:16}}>{n.icon}</span>{n.label}
          </div>
        ))}
      </nav>
      <div style={{padding:16,borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:"50%",
            background:`linear-gradient(135deg,${C.accent},#7c3aed)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:800,fontSize:14,color:"#fff"}}>N</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.text}}>Nitya</div>
            <div style={{fontSize:10,color:C.muted}}>Quality Engineer</div>
          </div>
        </div>
      </div>
    </div>
  );
}

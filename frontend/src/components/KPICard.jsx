import { C } from "../theme";
export default function KPICard({ label, value, sub, color, icon }) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,
      padding:"20px 24px",borderTop:`3px solid ${color}`,display:"flex",
      flexDirection:"column",gap:6,transition:"transform 0.2s",cursor:"default"}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:28,fontWeight:800,color,fontFamily:"monospace"}}>{value}</span>
        <span style={{fontSize:24}}>{icon}</span>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:C.text,letterSpacing:1}}>{label}</div>
      {sub && <div style={{fontSize:11,color:C.muted}}>{sub}</div>}
    </div>
  );
}

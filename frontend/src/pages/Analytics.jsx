import { useState, useEffect } from "react";
import { RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,
  BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,Cell,ResponsiveContainer } from "recharts";
import { C, PIE_COLORS } from "../theme";
import { dashboardAPI } from "../utils/api";
import SectionTitle from "../components/SectionTitle";

const TT = { contentStyle:{background:`${C.panel}`,border:`1px solid ${C.border}`,borderRadius:8,color:`${C.text}`} };

export default function Analytics() {
  const [dist,  setDist]  = useState([]);
  const [pred,  setPred]  = useState([]);

  useEffect(() => {
    dashboardAPI.defectDist().then(setDist).catch(()=>{
      const types=["Scratch","Crack","Dent","Discoloration","Missing Part","Rust","Weld Flaw","Surface Blur"];
      setDist(types.map(n=>({name:n,value:Math.floor(5+Math.random()*60)})));
    });
    dashboardAPI.predictive().then(setPred).catch(()=>{
      setPred([
        {machine:"Conveyor Belt A",risk:78,action:"Schedule maintenance within 3 days"},
        {machine:"Drill Unit B",   risk:42,action:"Monitor weekly, check lubrication"},
        {machine:"Press Machine C",risk:15,action:"Optimal condition — no action needed"},
        {machine:"Welding Arm D",  risk:61,action:"Inspect seals, reduce load"},
      ]);
    });
  }, []);

  const radarData = dist.slice(0,6).map(d=>({subject:d.name,A:d.value,fullMark:100}));
  const riskColor = r => r>70?C.red:r>40?C.yellow:C.green;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{background:`${C.card}`,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <SectionTitle>Defect Frequency Radar</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border}/>
              <PolarAngleAxis dataKey="subject" tick={{fill:C.muted,fontSize:10}}/>
              <PolarRadiusAxis tick={{fill:C.muted,fontSize:9}}/>
              <Radar name="Defects" dataKey="A" stroke={C.accent} fill={C.accent} fillOpacity={0.25}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:`${C.card}`,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <SectionTitle>All Defect Types</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis type="number" stroke={C.muted} tick={{fontSize:10}}/>
              <YAxis type="category" dataKey="name" stroke={C.muted} tick={{fontSize:10}} width={90}/>
              <Tooltip {...TT}/>
              <Bar dataKey="value" radius={[0,4,4,0]}>
                {dist.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{background:`${C.card}`,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SectionTitle>AI Predictive Maintenance Forecast</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          {pred.map((m,i)=>(
            <div key={i} style={{background:`${C.bg}`,borderRadius:12,padding:16,
              border:`1px solid ${riskColor(m.risk)}44`}}>
              <div style={{fontWeight:700,color:C.text,marginBottom:10,fontSize:13}}>{m.machine}</div>
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:C.muted}}>Failure Risk</span>
                  <span style={{fontSize:14,fontWeight:800,color:riskColor(m.risk)}}>{m.risk}%</span>
                </div>
                <div style={{background:C.border,borderRadius:4,height:6}}>
                  <div style={{width:`${m.risk}%`,height:"100%",background:riskColor(m.risk),borderRadius:4}}/>
                </div>
              </div>
              <div style={{fontSize:11,color:C.muted}}>{m.action}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {[["OEE Score","84.2%",C.green],["Throughput","247/hr",C.accent],
          ["Defect Rate","6.8%",C.red],["MTBF","1,240 hrs",C.yellow]].map(([l,v,c],i)=>(
          <div key={i} style={{background:`${C.card}`,borderRadius:12,padding:16,border:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:900,color:c,fontFamily:"monospace"}}>{v}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

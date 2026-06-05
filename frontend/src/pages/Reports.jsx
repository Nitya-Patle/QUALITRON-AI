import { useState, useEffect } from "react";
import { C } from "../theme";
import { reportsAPI, dashboardAPI } from "../utils/api";
import SectionTitle from "../components/SectionTitle";

export default function Reports() {
  const [days,      setDays]      = useState(7);
  const [generating,setGenerating]= useState(null);
  const [stats, setStats] = useState({
    total: 0, passed: 0, defective: 0,
    rate: 0, accuracy: 0, topDefect: "None"
  });

  useEffect(() => {
    Promise.all([dashboardAPI.kpis(), dashboardAPI.defectDist()])
      .then(([kpis, dist]) => {
        let top = "None";
        if (dist && dist.length > 0) {
          top = `${dist[0].name} (${dist[0].value} cases)`;
        }
        setStats({
          total: kpis.total || 0,
          passed: kpis.passed || 0,
          defective: kpis.defective || 0,
          rate: kpis.total ? ((kpis.defective / kpis.total) * 100).toFixed(1) : 0,
          accuracy: kpis.accuracy || 0,
          topDefect: top
        });
      }).catch(() => {});
  }, []);

  const download = async (type) => {
    setGenerating(type);
    try {
      if (type === "KPI") {
        alert("KPI Summary is currently viewable directly on the Dashboard and Analytics pages.");
        setGenerating(null);
        return;
      }
      const url = type === "PDF" ? reportsAPI.pdfUrl(days) : reportsAPI.excelUrl(days);
      const token = localStorage.getItem("qc_token");
      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to generate report");
      
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `Qualitron_${type}_Report_Last_${days}_days.${type === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
    } catch (e) {
      alert("Error generating report: " + e.message);
    }
    setGenerating(null);
  };

  const REPORTS = [
    {icon:"📄",label:"PDF Report",   desc:"Full inspection summary with charts and statistics",color:C.red,   type:"PDF"},
    {icon:"📊",label:"Excel Export", desc:"Raw data workbook with daily summary and bar chart",color:C.green, type:"Excel"},
    {icon:"📈",label:"KPI Summary",  desc:"Key performance indicators — pass rate, accuracy, OEE",color:C.accent,type:"KPI"},
  ];

  const DYNAMIC_STATS = [
    ["Total Inspected", stats.total],
    ["Passed", stats.passed],
    ["Defective", stats.defective],
    ["Defect Rate", `${stats.rate}%`],
    ["Avg Accuracy", `${stats.accuracy.toFixed(1)}%`],
    ["Top Defect", stats.topDefect],
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:`${C.card}`,borderRadius:16,padding:20,border:`1px solid ${C.border}`,
        display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:13,color:C.muted,fontWeight:700}}>REPORT PERIOD</div>
        {[7,14,30].map(d=>(
          <div key={d} onClick={()=>setDays(d)} style={{padding:"8px 16px",borderRadius:8,cursor:"pointer",
            fontWeight:700,fontSize:13,border:`1px solid ${days===d?C.accent:`${C.border}`}`,
            background:days===d?`${C.accent}22`:"transparent",color:days===d?C.accent:C.muted}}>
            Last {d} days
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {REPORTS.map((r,i)=>(
          <div key={i} style={{background:`${C.card}`,borderRadius:16,padding:28,border:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:12}}>{r.icon}</div>
            <div style={{fontWeight:800,color:C.text,marginBottom:8,fontSize:16}}>{r.label}</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.6}}>{r.desc}</div>
            <button onClick={()=>download(r.type)} disabled={!!generating}
              style={{width:"100%",padding:"11px",borderRadius:8,fontWeight:800,fontSize:13,
                border:`1px solid ${r.color}`,cursor:generating?"not-allowed":"pointer",
                background:generating===r.type?`${r.color}22`:"transparent",color:r.color}}>
              {generating===r.type?"⏳ Generating...":`⬇ Download ${r.type}`}
            </button>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{background:`${C.card}`,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
          <SectionTitle>Weekly Report Preview</SectionTitle>
          {DYNAMIC_STATS.map(([k,v],i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",
              padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.text,fontWeight:700,fontSize:13}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:`${C.card}`,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
          <SectionTitle>Export Options</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[["Date Range Filter","Last 7 / 14 / 30 days","📅"],
              ["Includes Charts","Bar, Area, Pie charts in PDF","📊"],
              ["Excel Macros","Auto-formatted with formulas","⚙️"],
              ["Scheduled Reports","Daily email at 8:00 AM","⏰"],
              ["Cloud Backup","Auto-save to AWS S3","☁️"]].map(([t,d,ic],i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                background:`${C.bg}`,borderRadius:8,border:`1px solid ${C.border}`}}>
                <span style={{fontSize:20}}>{ic}</span>
                <div>
                  <div style={{fontWeight:700,color:C.text,fontSize:13}}>{t}</div>
                  <div style={{fontSize:11,color:C.muted}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { AreaChart,Area,BarChart,Bar,LineChart,Line,PieChart,Pie,Cell,
  XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer } from "recharts";
import { C, PIE_COLORS } from "../theme";
import { dashboardAPI, inspectAPI } from "../utils/api";
import KPICard from "../components/KPICard";
import SectionTitle from "../components/SectionTitle";

const TOOLTIP_STYLE = { contentStyle:{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,color:C.text} };

export default function Dashboard() {
  const [kpis,    setKpis]    = useState({total:0,defective:0,passed:0,pass_rate:0,accuracy:0});
  const [daily,   setDaily]   = useState([]);
  const [hourly,  setHourly]  = useState([]);
  const [dist,    setDist]    = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError("");

    // Load KPIs
    try {
      const data = await dashboardAPI.kpis();
      setKpis(data);
    } catch(e) {
      setError("Failed to connect to the backend. Please check your network connection or server status.");
    }

    // Load daily trend
    try {
      const data = await dashboardAPI.daily();
      if (data.length > 0) setDaily(data);
    } catch(e) { console.log("daily fetch failed:", e); }

    // Load hourly
    try {
      const data = await dashboardAPI.hourly();
      if (data.length > 0) setHourly(data);
    } catch(e) { console.log("hourly fetch failed:", e); }

    // Load defect distribution
    try {
      const data = await dashboardAPI.defectDist();
      if (data.length > 0) setDist(data);
    } catch(e) { console.log("defect dist fetch failed:", e); }

    // Load recent real inspection records from DB
    try {
      const data = await inspectAPI.history(1, 10);
      if (data.records && data.records.length > 0) {
        setRecords(data.records);
      }
    } catch(e) { console.log("records fetch failed:", e); }

    setLoading(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>

      {/* Error Banner */}
      {error && (
        <div style={{background:`${C.red}15`,border:`1px solid ${C.red}`,borderRadius:12,
          padding:"14px 20px",color:C.red,fontSize:13,display:"flex",
          justifyContent:"space-between",alignItems:"center"}}>
          <span>⚠️ {error}</span>
          <button onClick={loadAllData} style={{padding:"6px 14px",borderRadius:8,
            border:`1px solid ${C.red}`,background:"transparent",color:C.red,
            cursor:"pointer",fontSize:12,fontWeight:700}}>🔄 Retry</button>
        </div>
      )}

      {/* Refresh Button */}
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <button onClick={loadAllData} style={{padding:"8px 16px",borderRadius:8,
          border:`1px solid ${C.border}`,background:C.card,color:C.muted,
          cursor:"pointer",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
          🔄 {loading ? "Loading..." : "Refresh Data"}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        <KPICard label="TOTAL INSPECTED" value={loading?"...":kpis.total.toLocaleString()} sub="This week" color={C.accent} icon="🔍"/>
        <KPICard label="DEFECTIVE"       value={loading?"...":kpis.defective} sub={`${(100-(kpis.pass_rate||0)).toFixed(1)}% defect rate`} color={C.red} icon="⚠️"/>
        <KPICard label="PASSED"          value={loading?"...":kpis.passed.toLocaleString()} sub="Quality approved" color={C.green} icon="✅"/>
        <KPICard label="AI ACCURACY"     value={loading?"...":`${kpis.accuracy}%`} sub="Hybrid AI System" color={C.yellow} icon="🤖"/>
      </div>

      {/* Charts Row 1 */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
        <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <SectionTitle>Daily Inspection Trend</SectionTitle>
          {daily.length === 0 ? (
            <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",
              color:C.muted,fontSize:13}}>
              {loading ? "Loading..." : "No inspection data available yet. Please upload an image on the AI Inspection page."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.red} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={C.red} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="day"  stroke={C.muted} tick={{fontSize:11}}/>
                <YAxis stroke={C.muted} tick={{fontSize:11}}/>
                <Tooltip {...TOOLTIP_STYLE}/>
                <Legend/>
                <Area type="monotone" dataKey="total"     name="Total"     stroke={C.accent} fill="url(#gT)" strokeWidth={2}/>
                <Area type="monotone" dataKey="defective" name="Defective" stroke={C.red}   fill="url(#gD)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <SectionTitle>Defect Distribution</SectionTitle>
          {dist.length === 0 ? (
            <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",
              color:C.muted,fontSize:13,textAlign:"center"}}>
              {loading ? "Loading..." : "No defect distribution data available."}
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={dist.slice(0,5)} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {dist.slice(0,5).map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
                {dist.slice(0,5).map((d,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.muted}}>
                    <div style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i]}}/>
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <SectionTitle>Hourly Inspections</SectionTitle>
          {hourly.length === 0 ? (
            <div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>
              {loading ? "Loading..." : "No inspection data for today."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="hour" stroke={C.muted} tick={{fontSize:9}}/>
                <YAxis stroke={C.muted} tick={{fontSize:11}}/>
                <Tooltip {...TOOLTIP_STYLE}/>
                <Bar dataKey="total"   name="Total"   fill={C.accent} radius={[4,4,0,0]}/>
                <Bar dataKey="defects" name="Defects" fill={C.red}    radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
          <SectionTitle>Accuracy Trend</SectionTitle>
          {daily.length === 0 ? (
            <div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:13}}>
              {loading ? "Loading..." : "No accuracy data available."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="day" stroke={C.muted} tick={{fontSize:11}}/>
                <YAxis domain={[85,100]} stroke={C.muted} tick={{fontSize:11}}/>
                <Tooltip {...TOOLTIP_STYLE}/>
                <Line type="monotone" dataKey="accuracy" name="Accuracy %"
                  stroke={C.yellow} strokeWidth={2.5} dot={{fill:C.yellow,r:4}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Records Table */}
      <div style={{background:C.card,borderRadius:16,padding:20,border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <SectionTitle>Recent Inspections</SectionTitle>
          <span style={{fontSize:11,color:C.muted}}>{records.length} records</span>
        </div>

        {records.length === 0 ? (
          <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
            <div style={{fontSize:40,marginBottom:12}}>📭</div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:6}}>
              {loading ? "Loading records..." : "No recent records found"}
            </div>
            <div style={{fontSize:12}}>
              {!loading && "Upload an image on the AI Inspection page and it will appear here."}
            </div>
          </div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>{["ID","Product","Operator","Status","Defects","Accuracy","Time"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"8px 12px",color:C.muted,
                    fontWeight:700,borderBottom:`1px solid ${C.border}`,fontSize:11,letterSpacing:1}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {records.map((r,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                    <td style={{padding:"10px 12px",color:C.accent,fontFamily:"monospace",fontWeight:700,fontSize:11}}>
                      {String(r._id).slice(0,12)}
                    </td>
                    <td style={{padding:"10px 12px",color:C.text}}>{r.product}</td>
                    <td style={{padding:"10px 12px",color:C.text}}>{r.operator}</td>
                    <td style={{padding:"10px 12px"}}>
                      <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:800,
                        background:r.status==="PASS"?`${C.green}22`:`${C.red}22`,
                        color:r.status==="PASS"?C.green:C.red,
                        border:`1px solid ${r.status==="PASS"?C.green:C.red}`}}>{r.status}</span>
                    </td>
                    <td style={{padding:"10px 12px",color:r.defect_count>0?C.red:C.green,fontWeight:700}}>
                      {r.defect_count}
                    </td>
                    <td style={{padding:"10px 12px",color:C.yellow}}>{r.accuracy}%</td>
                    <td style={{padding:"10px 12px",color:C.muted,fontSize:11}}>{r.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
